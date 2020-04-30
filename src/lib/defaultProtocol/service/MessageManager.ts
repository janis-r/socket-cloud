import {ContextId} from "../../configurationContext/data/ContextId";
import {ChannelId} from "../data/ChannelId";
import {CachedMessage} from "../data/cache/CachedMessage";
import {CacheFilter} from "../data/cache/CacheFilter";

export abstract class MessageManager {
    /**
     * Register new message with manager to register message with server and retrieve message id
     * @param contextId Context id this message is sent within
     * @param payload Message payload
     * @param origin String identifying message origin.
     * @param channels List of information channels this message is sent to, if any
     */
    abstract registerMessage(contextId: ContextId,
                             payload: string,
                             origin: { connectionId: string } | { apiCallId: number | string },
                             channels: string[]
    ): Promise<string>;

    /**
     * Retrieve cached messages
     * @param contextId
     * @param channelId
     * @param filter
     */
    abstract getCachedMessages(contextId: ContextId, channelId: ChannelId, filter: CacheFilter): Promise<Array<CachedMessage> | null>;

    /**
     * Clear message storage of overdue messages.
     */
    abstract clearMessageCache(): Promise<void>;
}

