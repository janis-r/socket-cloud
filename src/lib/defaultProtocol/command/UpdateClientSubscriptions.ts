import {Command, Event, Inject} from "quiver-framework";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {MessageType} from "../data/MessageType";
import {SubscribeMessage} from "../data/clientMessage/SubscribeMessage";
import {UnsubscribeMessage} from "../data/clientMessage/UnsubscribeMessage";
import {ClientConnection} from "../../clientConnectionPool/model/ClientConnection";

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
