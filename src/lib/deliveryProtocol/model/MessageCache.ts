import {ContextId} from "../../configurationContext";
import {ChannelId} from "../data/ChannelId";
import {RestoredMessage} from "../data/serverMessage/RestoreChannelsResponseMessage";

export class MessageCache {

    private readonly messagesByContext = new Map<ContextId, Set<CachedMessage>>();
    private readonly channelsByContext = new Map<ContextId, Map<ChannelId, Set<CachedMessage>>>();

    write(context: ContextId, message: RestoredMessage): void {
        const cachedMessage: CachedMessage = {time: Date.now(), message};

        const {messagesByContext, channelsByContext} = this;
        // TODO: Here messages will never be deleted - cannot stay that way when local testing is done
        if (!messagesByContext.has(context)) {
            messagesByContext.set(context, new Set<CachedMessage>([cachedMessage]));
        } else {
            messagesByContext.get(context).add(cachedMessage);
        }

        if (message.channels && message.channels.length) {
            if (!channelsByContext.has(context)) {
                channelsByContext.set(context, new Map<ChannelId, Set<CachedMessage>>());
            }
            const contextChannels = channelsByContext.get(context);
            message.channels.forEach(channelId => {
                if (!contextChannels.has(channelId)) {
                    contextChannels.set(channelId, new Set<CachedMessage>([cachedMessage]));
                } else {
                    contextChannels.get(channelId).add(cachedMessage);
                }
            });
        }
    }

    getMessageCache(context: ContextId, channelId: ChannelId, props: { cacheTimeMs?: number, maxCacheSize?: number, messageId?: string }): Array<CachedMessage> | null {
        const {channelsByContext} = this;
        const {cacheTimeMs, maxCacheSize, messageId} = props;
        if (!cacheTimeMs && !maxCacheSize) {
            return null;
        }

        if (!channelsByContext.has(context)) {
            return null;
        }

        const channelMessages = channelsByContext.get(context).get(channelId);
        if (!channelMessages || channelMessages.size === 0) {
            return null;
        }

        const epoch = cacheTimeMs ? Date.now() - cacheTimeMs : null;
        const messages = new Array<CachedMessage>();
        for (const cachedMessage of [...channelMessages].reverse()) {
            if (maxCacheSize && messages.length === maxCacheSize) {
                break;
            }
            if (epoch && cachedMessage.time < epoch) {
                break;
            }
            if (messageId && cachedMessage.message.messageId === messageId) {
                break;
            }
            messages.push(cachedMessage);
        }
        return messages;
    }
}

type CachedMessage = {
    message: RestoredMessage,
    time: number
};
