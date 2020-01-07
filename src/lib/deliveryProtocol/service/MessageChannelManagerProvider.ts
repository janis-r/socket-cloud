import {ConfigurationContext, ConfigurationContextProvider, ContextId} from "../../configurationContext";
import {Inject, Injector} from "qft";
import {MessageChannelManager} from "./MessageChannelManager";

export class MessageChannelManagerProvider {

    @Inject()
    private readonly injector: Injector;

    @Inject()
    private readonly configurationContextProvider: ConfigurationContextProvider;

    private readonly channelsByContext = new Map<ContextId, Map<string, MessageChannelManager>>();

    readonly getChannelManager = async (contextId: ContextId, channelId: string): Promise<MessageChannelManager> => {
        const {channelsByContext, configurationContextProvider: {getConfigurationContext}, injector} = this;

        if (!channelsByContext.has(contextId)) {
            channelsByContext.set(contextId, new Map<string, MessageChannelManager>());
        }

        const contextChannels = channelsByContext.get(contextId);
        if (!contextChannels.has(channelId)) {
            const subInjector = injector.createSubInjector();
            subInjector.map(ConfigurationContext).toValue(await getConfigurationContext(contextId));
            const channel = subInjector.injectInto(new MessageChannelManager(channelId));
            contextChannels.set(contextId, channel);
            channel.onSadAndUseless(() => this.resetChannelManager(contextId, channelId)).once();
        }

        return contextChannels.get(contextId);
    };

    private resetChannelManager(contextId: ContextId, channelId: string): void {
        const {channelsByContext} = this;
        if (channelsByContext.has(contextId)) {
            const contextChannels = channelsByContext.get(contextId);
            if (contextChannels.has(channelId)) {
                contextChannels.delete(channelId);
            }
        }
    }

}
