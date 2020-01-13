import {Command, EventDispatcher, Inject} from "qft";
import {ClientMessageEvent, CloseReason} from "../../clientConnectionPool";
import {deserializeClientMessage, MessageType} from "../data";
import {IncomingClientMessageEvent} from "../event/IncomingClientMessageEvent";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";

export class HandleClientMessage implements Command {

    @Inject()
    private event: ClientMessageEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {
            event: {message, connection, connection: {context: {id: contextId}}},
            dataContextManagerProvider: {getContextManager},
            eventDispatcher
        } = this;

        if (message instanceof Buffer) {
            connection.closeConnection(CloseReason.UnsupportedData, `Binary data is not supported!`);
            return;
        }

        const parsedMessage = deserializeClientMessage(message);
        if (!parsedMessage) {
            connection.closeConnection(CloseReason.ProtocolError, `Cannot deserialize message!`);
            return;
        }

        if (parsedMessage.type === MessageType.PushToServer) {
            const {context: {maxPayloadSize}} = await getContextManager(contextId);
            if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(parsedMessage.payload)) {
                connection.closeConnection(CloseReason.MessageTooBig, `Payload size exceeded!`);
                return;
            }
        }

        eventDispatcher.dispatchEvent(new IncomingClientMessageEvent(connection, parsedMessage));
    }

}
