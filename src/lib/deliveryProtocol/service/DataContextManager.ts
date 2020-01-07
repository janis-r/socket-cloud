import {Inject} from "qft";
import {ConfigurationContext} from "../../configurationContext";
import {ClientConnection, ClientConnectionPool} from "../../clientConnectionPool";
import {IncomingClientMessage, MessageType} from "../data";
import {MessageChannelManagerProvider} from "./MessageChannelManagerProvider";

export class DataContextManager {

    @Inject()
    readonly context: ConfigurationContext;

    @Inject()
    readonly connectionPool: ClientConnectionPool;

    @Inject()
    readonly messageChannelManagerProvider: MessageChannelManagerProvider;

    handleNewConnection(connection: ClientConnection): void {

    }

    handleRemovedConnection(connection: ClientConnection): void {

    }

    async handleClientMessage(message: IncomingClientMessage, connection: ClientConnection): Promise<void> {
        const {messageChannelManagerProvider: {getChannelManager}} = this;
        const {context: {id: contextId}} = connection;

        switch (message.type) {
            case MessageType.Subscribe:
                for (const channelId of message.channels) {
                    const manager = await getChannelManager(contextId, channelId);
                    manager.subscribe(connection);
                }
                break;
            case MessageType.Unsubscribe:
                for (const channelId of message.channels) {
                    const manager = await getChannelManager(contextId, channelId);
                    manager.unsubscribe(connection);
                }
                break;
            case MessageType.Push:
                for (const channelId of message.channels) {
                    const manager = await getChannelManager(contextId, channelId);
                    manager.write(message.payload, connection)
                }
                break;
            case MessageType.Restore :
                for (const {channel, mid} of message.channels) {
                    const manager = await getChannelManager(contextId, channel);
                    manager.restoreSubscription(connection, mid);
                }
                break;
        }
    }
}
