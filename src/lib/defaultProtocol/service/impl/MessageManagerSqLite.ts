import {Inject} from "quiver-framework";
import {ConfigurationContextProvider, ContextId} from "../../../configurationContext";
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
                message_id INTEGER PRIMARY KEY,
                channel    VARCHAR NOT NULL, -- channel id or external id of a connection this message was sent to in form @exid:{externalId}
                FOREIGN KEY (message_id) REFERENCES messages (id)
            );

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

        const messages = await all<{ id: number, time: string, payload: string, channel: ChannelId }>(`
                    SELECT id, time, payload, channel
                    FROM messages
                             JOIN message_recipients ON
                        message_recipients.message_id = messages.id AND channel = ?
                    WHERE messages.context_id = ?
                      AND messages.payload IS NOT NULL
            `,
            [channelId, contextId]
        );

        return messages.map(({id,time,payload,channel}) => ({
            id: id.toString(32),
            time: new Date(time).getT

                // {field: "time", type: "number"},
                // {field: "messageId", type: "string"},
                // {field: "payload", type: "string"},
                // {field: "channels", type: "string[]", optional: true}
        }))

        console.log('>> messages');
        console.log(messages);
        // process.exit();

        return null;
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
}

