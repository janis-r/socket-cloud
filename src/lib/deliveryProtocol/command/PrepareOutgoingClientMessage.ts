import {Command, Event, EventDispatcher, Inject} from "qft";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {OutgoingMessage, PushMessage} from "../data";
import {ClientConnection} from "../../clientConnectionPool";
import {MessageCache} from "../model/MessageCache";
import {nextMessageId} from "../util/nextMessageId";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";

export class PrepareOutgoingClientMessage implements Command {

    @Inject()
    private event: Event<{ connection: ClientConnection, message: PushMessage }>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private messageCache: MessageCache;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {
            event: {
                data: {
                    message: {channels, payload},
                    connection: {context: {id: contextId}}
                }
            },
            dataContextManagerProvider: {getContextManager},
            messageCache,
            eventDispatcher
        } = this;

        const contextManager = await getContextManager(contextId);
        const cachedChannels = channels.filter(channelId => !!contextManager.getChannelCachingPolicy(channelId));
        if (cachedChannels.length > 0) {
            messageCache.write(contextId, {channels: cachedChannels, payload});
        }

        const message: OutgoingMessage = {payload, channels, mid: nextMessageId()};
        eventDispatcher.dispatchEvent(new OutgoingMessageEvent(contextId, message))
    }
}
