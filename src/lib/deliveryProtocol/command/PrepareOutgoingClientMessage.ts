import {Command, Event, EventDispatcher, Inject} from "qft";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {MessageType, PushToServerMessage} from "../data";
import {ClientConnection} from "../../clientConnectionPool";
import {MessageCache} from "../model/MessageCache";
import {nextMessageId} from "../util/nextMessageId";
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

        const messageId = nextMessageId();
        if (cachedChannels.length > 0) {
            messageCache.write(contextId, {channels: cachedChannels, payload, messageId});
        }

        const message: PushToClientMessage = {type: MessageType.PushToClient, messageId, payload, channels};
        eventDispatcher.dispatchEvent(new OutgoingMessageEvent(contextId, message))
    }
}
