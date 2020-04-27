import {Command, Inject} from "quiver-framework";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {ClientConnection, ClientConnectionPool, ExternalId} from "../../clientConnectionPool";
import {serializeServerMessage} from "../data";
import {getExternalIdFromChannelId} from "../data/ChannelId";

export class BroadcastOutgoingMessage implements Command {

    @Inject()
    private event: OutgoingMessageEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private clientConnectionPool: ClientConnectionPool;

    async execute(): Promise<void> {
        const {
            event: {contextId, message, addRecipientProvider},
            dataContextManagerProvider: {getContextManager},
            clientConnectionPool: {getConnectionsByContextAndExternalId}
        } = this;

        let reportConnectionCount: (value: number) => void;
        addRecipientProvider(new Promise<number>(resolve => reportConnectionCount = resolve));

        const contextManager = await getContextManager(contextId);

        const externalIds = new Set<ExternalId>();
        const channels = message.channels.filter(channel => {
            const externalId = getExternalIdFromChannelId(channel);
            if (externalId) {
                externalIds.add(externalId);
                return false;
            }
            return true;
        });

        const connections = new Set<ClientConnection>(message.channels ? [].concat(...channels
            .map(channelId => contextManager.getChannelConnections(channelId))
            .filter(value => !!value)
            .map(value => ([...value]))
        ) : []);

        if (externalIds.size > 0) {
            [...externalIds]
                .map(externalId => getConnectionsByContextAndExternalId(contextId, externalId))
                .filter(entry => !!entry)
                .forEach(
                    connectionsByExternalId => connectionsByExternalId.forEach(value => connections.add(value))
                );
        }

        const msg = serializeServerMessage(message); //TODO: Each connection should receive only listing of channels it's subscribed to and parameter indicating whether this is individual message
        connections.forEach(connection => connection.send(msg));
        reportConnectionCount(connections.size);
    }

}
