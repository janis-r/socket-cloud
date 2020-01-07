import {Inject} from "qft";
import {ConfigurationContext, MessageCachingPolicy} from "../../configurationContext";
import {CallbackCollection} from "../../utils/CallbackCollection";
import {ClientConnection} from "../../clientConnectionPool";
import {OutgoingClientMessage} from "../data";

export class MessageChannelManager {

    private messageId = 0;

    @Inject()
    readonly context: ConfigurationContext;

    private readonly connections = new Set<ClientConnection>();
    private readonly messageCache = new Map<string, CachedMessage>();
    private readonly sadAndUselessCallback = new CallbackCollection<void>();

    constructor(readonly channelId: string) {

    }

    readonly onSadAndUseless = this.sadAndUselessCallback.polymorph;

    subscribe(connection: ClientConnection): void {
        this.connections.add(connection);
    }

    unsubscribe(connection: ClientConnection): void {
        this.connections.delete(connection);
    }

    async write(payload: string, connection: ClientConnection): Promise<number> {
        const {cacheConfig: {cacheTimeMs, maxCacheSize}, messageCache, connections} = this;
        const cachingEnabled = cacheTimeMs || maxCacheSize;

        const outgoingMessage: OutgoingClientMessage = {payload};
        if (cachingEnabled) {
            outgoingMessage.mid = this.nextMessageId;
            messageCache.set(outgoingMessage.mid, {...outgoingMessage, time: Date.now()});
        }
        if (connections.size === 0) {
            return 0;
        }

        const msg = JSON.stringify(outgoingMessage);
        await Promise.all([...connections].map(connection => connection.send(msg)));
        return connections.size;
    }

    restoreSubscription(connection: ClientConnection, lastKnownMessageId: string): void {
        const {cacheConfig: {cacheTimeMs, maxCacheSize}, messageCache, connections} = this;
        if (messageCache.has(lastKnownMessageId)) {
            const msg = messageCache.get(lastKnownMessageId);
            const allMessages = [...messageCache.values()];
            const messageToSend = allMessages.slice(allMessages.indexOf(msg) + 1);
            if (messageToSend.length > 0) {
                messageToSend.forEach(({time, ...cleanMsg}) => connection.send(JSON.stringify(cleanMsg)))
            }
        }
    }

    private get cacheConfig(): MessageCachingPolicy {
        const {
            channelId,
            context: {
                messageCaching,
                messageCaching: {perChannelCachingConfig}
            }
        } = this;
        if (!messageCaching) { // No message caching is known here
            return {}
        }

        if (perChannelCachingConfig && channelId in perChannelCachingConfig) {
            const {cacheTimeMs, maxCacheSize} = messageCaching;
            const {cacheTimeMs: localCacheTimeMs, maxCacheSize: localMaxCacheSize} = perChannelCachingConfig[channelId];
            return {
                cacheTimeMs: localCacheTimeMs ?? cacheTimeMs,
                maxCacheSize: localMaxCacheSize ?? maxCacheSize
            }
        }

        return messageCaching;
    }

    private get nextMessageId(): string {
        const id = (this.messageId++).toString(16);
        if (this.messageId === 0xFFFF) {
            this.messageId = 0;
        }
        return id;
    }
}

type CachedMessage = OutgoingClientMessage & { time?: number };
