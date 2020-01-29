import {toMilliseconds} from "ugd10a";
import {CachedMessage} from "../data/cache/CachedMessage";
import {ConfigurationContext} from "../../configurationContext";
import {CacheFilter} from "../data/cache/CacheFilter";
import {CallbackCollection} from "../../utils/CallbackCollection";

export class ChannelMessageCache {

    private static readonly maxMessagesPerChannel = 1000;
    private static readonly maxChannelCacheTime = toMilliseconds(24, "hours") * 7; // 1 week
    private static readonly cleanupInterval = toMilliseconds(1, "minutes");

    private readonly messages = new Array<CachedMessage>();
    private cleanupIntervalId: ReturnType<typeof setInterval>;

    private readonly onEmptyCallback = new CallbackCollection<void>();
    readonly onEmpty = this.onEmptyCallback.polymorph;

    constructor(readonly context: ConfigurationContext,
                readonly channelId: string) {
    }

    addMessage(message: CachedMessage): void {
        const {cleanupInterval} = ChannelMessageCache;
        const {messages, cacheConfig: {maxCacheSize}, clearOutdatedMessages} = this;

        // Add message to cache
        messages.push(message);
        // And check if max cache length is exceeded
        while (messages.length > maxCacheSize) {
            messages.shift();
        }
        // This is first message that's added - start cleanup interval now
        if (messages.length > 0 && !this.cleanupIntervalId) {
            this.cleanupIntervalId = setInterval(clearOutdatedMessages, cleanupInterval);
        }
    }

    getMessages(filter: CacheFilter = {}): Array<CachedMessage> {
        const {messages} = this;

        this.clearOutdatedMessages();

        const {maxAge, maxLength, messageId} = filter;
        const minEpoch = maxAge ? Date.now() - maxAge : null;

        const output = new Array<CachedMessage>();

        for (const cachedMessage of messages.reverse()) {
            if (maxLength && output.length === maxLength) {
                break;
            }
            if (minEpoch && cachedMessage.time < minEpoch) {
                break;
            }
            if (messageId && cachedMessage.messageId === messageId) {
                break;
            }
            output.push(cachedMessage);
        }
        return output;
    }

    get size() {
        return this.messages.length;
    }

    private readonly clearOutdatedMessages = () => {
        const {messages, cacheConfig: {cacheTimeMs}} = this;
        const minEpoch = Date.now() - cacheTimeMs;

        while (messages.length > 0) {
            if (messages[messages.length - 1].time > minEpoch) {
                break;
            }
            messages.splice(-1, 1);
        }

        if (!messages.length) {
            this.onEmptyCallback.execute();
            if (this.cleanupIntervalId) {
                clearInterval(this.cleanupIntervalId);
                this.cleanupIntervalId = null;
            }
        }
    };

    get cacheConfig() {
        const {channelId, context: {cachingPolicy, channelConfig}} = this;
        const {maxMessagesPerChannel, maxChannelCacheTime} = ChannelMessageCache;

        const maxCacheSize = channelConfig?.[channelId]?.cachingPolicy?.maxCacheSize ?? cachingPolicy?.maxCacheSize;
        const cacheTimeMs = channelConfig?.[channelId]?.cachingPolicy?.cacheTimeMs ?? cachingPolicy?.cacheTimeMs;

        return {
            maxCacheSize: maxCacheSize && maxCacheSize < maxMessagesPerChannel ? maxCacheSize : maxMessagesPerChannel,
            cacheTimeMs: cacheTimeMs && cacheTimeMs < maxChannelCacheTime ? cacheTimeMs : maxChannelCacheTime
        }
    }

}
