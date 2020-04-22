import {Inject} from "quiver-framework";
import {toSeconds} from "ugd10a";
import {CachingPolicy, ConfigurationContextProvider, ContextId} from "../../../configurationContext";
import {ChannelId} from "../../data/ChannelId";
import {CachedMessage} from "../../data/cache/CachedMessage";
import {MessageManager} from "../MessageManager";
import {CacheFilter} from "../../data/cache/CacheFilter";
import {SqLiteConnection} from "../../../sqLite";
import {ExternalId} from "../../../clientConnectionPool";

export class MessageManagerSqLite implements MessageManager {

    @Inject()
    private readonly contextProvider: ConfigurationContextProvider;

    private readonly db: SqLiteConnection;

    constructor() {
        try {
            this.db = new SqLiteConnection("db/message-cache.db");
            this.db.ready.then(() => this.initialize());
        } catch (e) {
            console.error(`Error while connecting to Sqlite: ${e.message}`);
        }
    }

    private async initialize() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS messages -- Message data
            (
                id         INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
                time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                context_id VARCHAR  NOT NULL,
                payload    TEXT,              -- Cached message payload that will be removed once message is no longer cached  
                origin     VARCHAR  NOT NULL, -- Message origination information
                size       INTEGER  NOT NULL  -- Message size in bytes
            );
            CREATE INDEX IF NOT EXISTS messages_context_id ON messages (context_id);

            CREATE TABLE IF NOT EXISTS message_recipients
            (
                message_id INTEGER NOT NULL,
                channel    VARCHAR NOT NULL, -- channel id or external id of a connection this message was sent to in form @exid:{externalId}
                FOREIGN KEY (message_id) REFERENCES messages (id)
            );
            CREATE INDEX IF NOT EXISTS message_recipients_message_id ON message_recipients (message_id);
        `);
    }

    async registerMessage(contextId: ContextId, payload: string, origin: { connectionId: string } | { apiCallId: string }, channels: string[] | null, connectionIds: ExternalId[] | null): Promise<string> {
        const {db: {run, prepare}} = this;

        const useCache = await this.shouldCacheMessage(contextId, channels, connectionIds);
        const {lastID: messageId} = await run(`
                    INSERT INTO messages (context_id, payload, origin, size)
                    VALUES (?, ?, ?, ?)
            `,
            [contextId, useCache ? payload : null, JSON.stringify(origin), Buffer.byteLength(payload)]
        );

        const messageChannels = channels?.length ? [...channels] : [];
        if (connectionIds) {
            messageChannels.push(...connectionIds.map(id => `@exid:${id}`));
        }

        if (messageChannels.length) {
            // TODO : this
            const insertStatement = prepare(`
                INSERT INTO message_recipients (message_id, channel)
                VALUES (?, ?)
            `);
            messageChannels.forEach(channel => insertStatement.run([messageId, channel]));
            insertStatement.finalize();
        }

        return messageId.toString(32);
    }

    async getCachedMessages(contextId: ContextId, channelId: ChannelId, filter: CacheFilter): Promise<Array<CachedMessage> | null> {
        const {db: {all}} = this;
        const cachingPolicy = await this.getChannelCachingPolicy(contextId, channelId);
        if (!cachingPolicy) {
            // Caching is not enabled for this channel
            return null;
        }

        const {cacheTime, cacheSize} = cachingPolicy;
        const {maxAge, maxLength, messageId} = filter || {};

        const queryMaxAge = cacheTime && maxAge ? Math.min(cacheTime, maxAge) : cacheTime ?? maxAge;
        const queryLimit = cacheSize && maxAge ? Math.min(cacheSize, maxLength) : cacheSize ?? maxLength;

        const messages = await all<{ id: number, time: string, payload: string, channel: ChannelId }>(`
                    SELECT id, time, payload, channel
                    FROM messages
                             JOIN message_recipients ON message_recipients.message_id = messages.id AND channel = $channelId
                    WHERE messages.context_id = $contextId
                      AND messages.payload IS NOT NULL
                      AND ($messageId IS NULL OR messages.id > $messageId)
                      AND ($maxAge IS NULL OR messages.time > datetime($maxAge, 'unixepoch'))
                    ORDER BY messages.id DESC
                    ${queryLimit ? `LIMIT ${queryLimit}` : ``}
            `,
            {
                $channelId: channelId,
                $contextId: contextId,
                $messageId: messageId ? parseInt(messageId, 32) : null,
                $maxAge: queryMaxAge ? toSeconds(queryMaxAge, "milliseconds") : null
            }
        );

        return messages.reverse().map(({id, time, payload, channel}) => ({
            messageId: id.toString(32),
            time: new Date(time).getTime(),
            payload,
            channels: [channel]
        }));
    }

    async clearMessageCache(): Promise<void> {
        // TODO: This method is way too big!
        console.log('>> clearMessageCache');
        const {db: {all}} = this;

        type DbRow = { id: number, time: string, context_id: string, channel: string };
        const cachedMessages = await all<DbRow>(`
            SELECT DISTINCT id, time, context_id, channel
            FROM messages
                     JOIN message_recipients ON messages.id = message_recipients.message_id
            WHERE payload IS NOT NULL
            ORDER BY id
        `);
        console.log('>> cachedMessages', cachedMessages);
        if (!cachedMessages.length) {
            return;
        }

        const groupedById = new Map<DbRow["id"], Set<Omit<DbRow, "id">>>();
        const groupedByContextAndChannel = new Map<string, Set<DbRow>>();
        for (const message of cachedMessages) {
            const {id, ...data} = message;
            if (!groupedById.has(id)) {
                groupedById.set(id, new Set<Omit<DbRow, "id">>([data]));
            } else {
                groupedById.get(id).add(data);
            }

            const {context_id, channel} = message;
            const contextAndChannel = `${context_id}-${channel}`;
            if (!groupedByContextAndChannel.has(contextAndChannel)) {
                groupedByContextAndChannel.set(contextAndChannel, new Set<DbRow>([message]));
            } else {
                groupedByContextAndChannel.get(contextAndChannel).add(message);
            }
        }

        const messagesToClear = new Set<number>();

        for (const [messageId, messages] of groupedById) {
            const cachingPolicies = await Promise.all(
                [...messages].map(({context_id, channel}) => this.getChannelCachingPolicy(context_id, channel))
            );

            const {cacheTime, cacheSize} = cachingPolicies.filter(entry => !!entry)
                .reduce(({cacheSize, cacheTime}, {cacheSize: c_cacheSize, cacheTime: c_cacheTime}) => ({
                    cacheSize: cacheSize && c_cacheSize ? Math.max(cacheSize, c_cacheSize) : cacheSize ?? c_cacheSize,
                    cacheTime: cacheTime && c_cacheTime ? Math.max(cacheTime, c_cacheTime) : cacheTime ?? c_cacheTime
                }));

            if (!cacheTime && !cacheSize) {
                // No cache config is defined for message - it could be removed?
                messagesToClear.add(messageId);
                continue;
            }

            const {time} = [...messages][0];
            if (cacheTime && new Date(time).getTime() + cacheTime < Date.now()) {
                messagesToClear.add(messageId);
            }
        }
        console.log('>> removed due to time', [...messagesToClear]);
        if (![...groupedById.keys()].some(id => !messagesToClear.has(id))) {
            // There are no untouched message ids left
            return;
        }

        for (const messages of groupedByContextAndChannel.values()) {
            const {context_id, channel} = [...messages][0];
            const {cacheSize} = await this.getChannelCachingPolicy(context_id, channel);
            if (cacheSize && messages.size > cacheSize) {
                [...messages].slice(0, messages.size - cacheSize).forEach(({id}) => messagesToClear.add(id));
            }
        }

        if (messagesToClear.size > 0) {
            console.log('>> Clear messages', [...messagesToClear]);
            await this.db.run(`
                        UPDATE messages
                        SET payload = NULL
                        WHERE id IN (?)
                `,
                [
                    [...messagesToClear]
                ]
            )
        }

    }

    /**
     * Check if context, channels and external ids combination requires message to be cached
     * @param contextId
     * @param channels
     * @param connectionIds
     */
    private async shouldCacheMessage(contextId: ContextId, channels: ChannelId[] | null, connectionIds: ExternalId[] | null): Promise<boolean> {
        const {contextProvider: {getConfigurationContext}} = this;
        const {cachingPolicy, channelConfig, individualMessageConfig} = await getConfigurationContext(contextId);

        if (channels && channels.length) {
            const channelHasCachingEnabled = channel => {
                const config = channelConfig[channel]?.cachingPolicy ?? cachingPolicy;
                return !!config?.cacheTime || !!config?.cacheSize;
            };

            if (channels.some(channelHasCachingEnabled)) {
                return true;
            }
        }

        if (!connectionIds || !connectionIds.length) {
            return false;
        }

        const config = individualMessageConfig?.cachingPolicy ?? cachingPolicy;
        return !!config?.cacheTime || !!config?.cacheSize;
    }

    private async getChannelCachingPolicy(contextId: ContextId, channel: ChannelId): Promise<CachingPolicy | null> {
        const {contextProvider: {getConfigurationContext}} = this;
        const {cachingPolicy, channelConfig} = await getConfigurationContext(contextId);
        const config = channelConfig[channel]?.cachingPolicy ?? cachingPolicy;
        return config && Object.keys(config).length ? config : null;
    }

}

