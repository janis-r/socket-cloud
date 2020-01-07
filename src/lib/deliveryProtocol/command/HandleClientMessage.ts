import {Command, Inject} from "qft";
import {ClientMessageEvent, CloseReason} from "../../clientConnectionPool";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {SyntheticEvent} from "../../utils/SyntheticEvent";
import {deserializeIncomingClientMessage} from "../data";

export class HandleClientMessage implements Command {

    @Inject()
    private event: SyntheticEvent<ClientMessageEvent>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;

    async execute(): Promise<void> {
        const {
            event: {
                source: {
                    message,
                    connection,
                    connection: {id: connectionId, context: {id: contextId}}
                }
            },
            dataContextManagerProvider: {getContextManager}
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

        const manager = await getContextManager(contextId);
        manager.handleClientMessage(parsedMessage, connection);
    }

}
