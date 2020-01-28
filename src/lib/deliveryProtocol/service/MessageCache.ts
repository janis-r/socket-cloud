import {ContextId} from "../../configurationContext";
import {ChannelId} from "../data/ChannelId";
import {CachedMessage} from "../data/cache/CachedMessage";
import {CacheFilter} from "../data/cache/CacheFilter";

export abstract class MessageCache {

    abstract write(context: ContextId, message: CachedMessage): void;

    abstract getCache(context: ContextId, channelId: ChannelId, filter: CacheFilter): Array<CachedMessage> | null;
}

