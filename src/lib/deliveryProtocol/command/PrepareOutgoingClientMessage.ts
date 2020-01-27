import {Command, Event, EventDispatcher, Inject} from "qft";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {MessageType, PushToServerMessage} from "../data";
import {ClientConnection} from "../../clientConnectionPool";
import {MessageCache} from "../service/MessageCache";
import {MessageIdProvider} from "../service/MessageIdProvider";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {PushToClientMessage} from "../data/serverMessage/PushToClientMessage";

export class PrepareOutgoingClientMessage implements Command {

    @Inject()
    private event: Event<{ connection: ClientConnection, message: PushToServerMessage }>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private messageCache: MessageCache;
    @Inject()
    private messageIdProvider: MessageIdProvider;
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
            messageIdProvider: {nextMessageId},
            eventDispatcher
        } = this;

        const contextManager = await getContextManager(contextId);
        const cachedChannels = channels.filter(channelId => !!contextManager.getChannelCachingPolicy(channelId));

        const messageId = nextMessageId();
        const time = Date.now();
        const message: PushToClientMessage = {type: MessageType.PushToClient, time, messageId, payload, channels};

        if (cachedChannels.length > 0) {
            messageCache.write(contextId, {time, messageId, payload, channels: cachedChannels});
        }

        eventDispatcher.dispatchEvent(new OutgoingMessageEvent(contextId, message))
    }
}
