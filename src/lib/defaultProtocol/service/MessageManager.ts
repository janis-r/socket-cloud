import {ContextId} from "../../configurationContext";
import {ChannelId} from "../data/ChannelId";
import {CachedMessage} from "../data/cache/CachedMessage";
import {CacheFilter} from "../data/cache/CacheFilter";
import {ExternalId} from "../../clientConnectionPool";

export abstract class MessageManager {
    /**
     * Register new message with manager to register message with server and retrieve message id
     * @param contextId Context id this message is sent within
     * @param payload Message payload
     * @param origin String identifying message origin.
     * @param channels List of information channels this message is sent to, if any
     * @param connectionIds List of connection external ids this message should be sent directly, if any
     */
    abstract registerMessage(contextId: ContextId,
                             payload: string,
                             origin: { connectionId: string } | { apiCallId: number | string },
                             channels: string[] | null,
                             connectionIds?: ExternalId[]
    ): Promise<string>;

    abstract getCachedMessages(contextId: ContextId, channelId: ChannelId, filter: CacheFilter): Promise<Array<CachedMessage> | null>;
}

