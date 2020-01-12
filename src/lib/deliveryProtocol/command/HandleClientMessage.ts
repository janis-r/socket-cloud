import {Command, EventDispatcher, Inject} from "qft";
import {ClientMessageEvent, CloseReason} from "../../clientConnectionPool";
import {deserializeIncomingClientMessage} from "../data";
import {IncomingClientMessageEvent} from "../event/IncomingClientMessageEvent";

export class HandleClientMessage implements Command {

    @Inject()
    private event: ClientMessageEvent;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {
            event: {message, connection},
            eventDispatcher
        } = this;

        if (message instanceof Buffer) {
            connection.closeConnection(CloseReason.UnsupportedData, `Binary data is not supported!`);
            return;
        }

        const parsedMessage = deserializeIncomingClientMessage(message);
        if (!parsedMessage) {
            connection.closeConnection(CloseReason.ProtocolError, `Cannot deserialize message!`);
            return;
        }

        eventDispatcher.dispatchEvent(new IncomingClientMessageEvent(connection, parsedMessage));
    }

}
