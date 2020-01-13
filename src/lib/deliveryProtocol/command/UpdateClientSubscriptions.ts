import {Command, Event, Inject} from "qft";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {MessageType, SubscribeMessage, UnsubscribeMessage} from "../data";
import {ClientConnection} from "../../clientConnectionPool";

export class UpdateClientSubscriptions implements Command {

    @Inject()
    private event: Event<{ connection: ClientConnection, message: SubscribeMessage | UnsubscribeMessage }>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;

    async execute(): Promise<void> {
        const {
            event: {
                data: {
                    connection,
                    connection: {context: {id: contextId}},
                    message
                },
            },
            dataContextManagerProvider: {getContextManager}
        } = this;

        const contextManager = await getContextManager(contextId);
        if (message.type === MessageType.Subscribe) {
            contextManager.subscribeToChannel(message.channels, connection);
        } else if (message.type === MessageType.Unsubscribe) {
            contextManager.unsubscribeFromChannel(message.channels, connection);
        }

    }

}
