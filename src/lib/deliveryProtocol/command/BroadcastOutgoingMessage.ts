import {Command, Inject} from "qft";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {ClientConnection, ClientConnectionPool} from "../../clientConnectionPool";

export class BroadcastOutgoingMessage implements Command {

    @Inject()
    private event: OutgoingMessageEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private clientConnectionPool: ClientConnectionPool;

    async execute(): Promise<void> {
        const {
            event: {contextId, message, externalIds, addRecipientProvider},
            dataContextManagerProvider: {getContextManager},
            clientConnectionPool: {getConnectionsByContextAndExternalId}
        } = this;

        let reportConnectionCount: (value: number) => void;
        addRecipientProvider(new Promise<number>(resolve => reportConnectionCount = resolve));

        const contextManager = await getContextManager(contextId);
        const connections = new Set<ClientConnection>(message.channels ? [].concat(...message.channels
            .map(channelId => contextManager.getChannelConnections(channelId))
            .map(value => ([...value]))
        ) : []);

        if (externalIds) {
            externalIds
                .map(externalId => getConnectionsByContextAndExternalId(contextId, externalId))
                .filter(entry => !!entry)
                .forEach(
                    connectionsByExternalId => connectionsByExternalId.forEach(value => connections.add(value))
                );
        }

        const msg = JSON.stringify(message);
        connections.forEach(value => value.send(msg));

        reportConnectionCount(connections.size);
    }

}