import { Command, Event, EventDispatcher, Inject } from "quiver-framework";
import { MessageType } from "../data/MessageType";
import { PushToServerMessage } from "../data/clientMessage/PushToServerMessage";
import { ClientConnection } from "../../clientConnectionPool/model/ClientConnection";
import { MessageManager } from "../service/MessageManager";
import { OutgoingMessageEvent } from "../event/OutgoingMessageEvent";
import { PushToClientMessage } from "../data/serverMessage/PushToClientMessage";

export class PrepareOutgoingClientMessage implements Command {

    @Inject()
    private event: Event<{ connection: ClientConnection, message: PushToServerMessage }>;
    @Inject()
    private messageManager: MessageManager;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {
            event: {
                data: {
                    message: { channels, payload },
                    connection: { id: connectionId, context: { id: contextId } }
                }
            },
            messageManager,
            eventDispatcher
        } = this;

        const messageId = await messageManager.registerMessage(contextId, payload, { connectionId }, channels);

        const message: PushToClientMessage = {
            type: MessageType.PushToClient,
            time: Date.now(),
            messageId,
            payload,
            channels
        };

        const messageEvent = new OutgoingMessageEvent(contextId, message);
        eventDispatcher.dispatchEvent(messageEvent);

        const recipients = await messageEvent.getRecipientCount();
        console.log('>> getRecipientCount:', recipients)
    }
}
