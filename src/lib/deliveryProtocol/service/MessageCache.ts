import {ContextId} from "../../configurationContext";
import {ChannelId} from "../data/ChannelId";
import {CachedMessage} from "../data/cache/CachedMessage";
import {CacheFilter} from "../data/cache/CacheFilter";

export abstract class MessageCache {

    abstract write(contextId: ContextId, message: CachedMessage): Promise<void>;

    abstract getCache(contextId: ContextId, channelId: ChannelId, filter: CacheFilter): Promise<Array<CachedMessage> | null>;
}

