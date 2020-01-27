import {ContextId} from "../../configurationContext";
import {ChannelId} from "../data/ChannelId";
import {CachedMessage} from "../data/serverMessage/RestoreChannelsResponseMessage";

export abstract class MessageCache {

    abstract write(context: ContextId, message: CachedMessage): void;

    abstract getMessageCache(context: ContextId, channelId: ChannelId, props: { cacheTimeMs?: number, maxCacheSize?: number, messageId?: string }): Array<CachedMessage> | null;
}
