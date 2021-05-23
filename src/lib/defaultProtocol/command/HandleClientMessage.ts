import { Command, EventDispatcher, Inject } from "quiver-framework";
import { ClientMessageEvent } from "../../clientConnectionPool/event/ClientMessageEvent";
import { CloseReason } from "../../clientConnectionPool/data/CloseReason";
import { deserializeClientMessage } from "../data/clientMessage/ClientMessage";
import { MessageType } from "../data/MessageType";
import { IncomingClientMessageEvent } from "../event/IncomingClientMessageEvent";
import { DataContextManagerProvider } from "../service/DataContextManagerProvider";

export class HandleClientMessage implements Command {

    @Inject()
    private event: ClientMessageEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {
            event: { message, connection, connection: { context: { id: contextId } } },
            dataContextManagerProvider: { getContextManager },
            eventDispatcher
        } = this;

        if (message instanceof Buffer) {
            connection.close(CloseReason.UnsupportedData, `Binary data is not supported!`);
            return;
        }

        const parsedMessage = deserializeClientMessage(message);
        console.log('>> incoming message', parsedMessage);
        if (!parsedMessage) {
            connection.close(CloseReason.ProtocolError, `Cannot deserialize message!`);
            return;
        }

        if (parsedMessage.type === MessageType.PushToServer) {
            const { context: { maxPayloadSize } } = await getContextManager(contextId);
            if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(parsedMessage.payload)) {
                connection.close(CloseReason.MessageTooBig, `Payload size exceeded!`);
                return;
            }
        }

        eventDispatcher.dispatchEvent(new IncomingClientMessageEvent(connection, parsedMessage));
    }

}
