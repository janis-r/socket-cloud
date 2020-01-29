import {Inject} from "qft";
import {ConfigurationContext, ConfigurationContextProvider, ContextId} from "../../../configurationContext";
import {ChannelId} from "../../data/ChannelId";
import {CachedMessage} from "../../data/cache/CachedMessage";
import {MessageCache} from "../MessageCache";
import {CacheFilter} from "../../data/cache/CacheFilter";
import {ChannelMessageCache} from "../../util/ChannelMessageCache";

/**
 * In memory implementation of message cache service - it should not be in use for a production env.
 */
export class InMemoryMessageCache implements MessageCache {

    @Inject()
    private readonly contextProvider: ConfigurationContextProvider;

    // TODO: Private messages by externalId should be cached as well
    // private readonly messagesByContext = new Map<ContextId, Set<CachedMessage>>();
    private readonly channelsByContext = new Map<ContextId, Map<ChannelId, ChannelMessageCache>>();

    async writeMessage(contextId: ContextId, message: CachedMessage): Promise<void> {
        const {channelsByContext, contextProvider: {getConfigurationContext}} = this;

        // if (!messagesByContext.has(context)) {
        //     messagesByContext.set(context, new Set<CachedMessage>([message]));
        // } else {
        //     messagesByContext.get(context).add(message);
        // }

        if (message.channels && message.channels.length) {

            if (!channelsByContext.has(contextId)) {
                channelsByContext.set(contextId, new Map<ChannelId, ChannelMessageCache>());
            }

            const contextChannels = channelsByContext.get(contextId);
            let configuration: ConfigurationContext;
            if (message.channels.some(channelId => !contextChannels.has(channelId))) {
                configuration = await getConfigurationContext(contextId);
            }

            message.channels.forEach(channelId => {
                if (!contextChannels.has(channelId)) {
                    const messageCache = new ChannelMessageCache(configuration, channelId);
                    contextChannels.set(channelId, messageCache);
                    messageCache.onEmpty(() => this.clearChannelCache(contextId, channelId));
                }
                contextChannels.get(channelId).addMessage(message);
            });
        }
    }

    async getCachedMessages(contextId: ContextId, channelId: ChannelId, filter: CacheFilter): Promise<Array<CachedMessage> | null> {
        const {channelsByContext} = this;
        return channelsByContext.get(contextId)?.get(channelId)?.getMessages(filter) || null;
    }

    clearChannelCache(contextId: ContextId, channelId: string): void {
        const {channelsByContext} = this;
        if (channelsByContext.get(contextId)?.get(channelId)) {
            channelsByContext.get(contextId).get(channelId).onEmpty().clear();
            channelsByContext.get(contextId).delete(channelId);
        }

    }
}

