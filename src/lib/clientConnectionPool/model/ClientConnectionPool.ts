import {ClientConnection} from "./ClientConnection";
import {ConnectionRemovedEvent, ConnectionState, NewConnectionEvent} from "..";
import {EventDispatcher, Inject} from "qft";
import {ClientMessageEvent} from "../event/ClientMessageEvent";
import chalk from "chalk";

export class ClientConnectionPool {

    @Inject()
    private eventDispatcher: EventDispatcher;

    private readonly byConnectionId = new Map<ClientConnection['id'], ClientConnection>();
    private readonly byContextId = new Map<ClientConnection['context']['id'], Set<ClientConnection>>();

    registerConnection(connection: ClientConnection): void {
        const {eventDispatcher, byConnectionId, byContextId} = this;
        const {id: connectionId, context: {id: contextId}} = connection;

        connection.addEventListener("error", ({data}) =>
                // TODO: Error should be logged
                console.log(chalk.red('Connection error:'), connectionId, data)
            ,
            this
        );
        connection.addEventListener("state-change", ({connection}) => this.removeConnection(connection), this)
            .withGuards(({connection: {state}}) => state >= ConnectionState.Closing)
            .once();

        connection.addEventListener("message",
            ({connection, message}) => eventDispatcher.dispatchEvent(
                new ClientMessageEvent(connection, message)
            ),
            this
        );

        if (byConnectionId.has(connectionId)) {
            throw new Error(`connectionId ${connectionId} must be unique`);
        }

        byConnectionId.set(connectionId, connection);

        if (!byContextId.has(contextId)) {
            byContextId.set(contextId, new Set<ClientConnection>([connection]));
        } else {
            byContextId.get(contextId).add(connection);
        }

        eventDispatcher.dispatchEvent(new NewConnectionEvent(connection));
    }

    readonly getConnectionsByContext = (contextId: ClientConnection['context']['id']) => this.byContextId.get(contextId) ?? null;

    private removeConnection(connection: ClientConnection): void {
        const {byContextId, byConnectionId, eventDispatcher} = this;

        console.log(chalk.red('Remove connection'), connection.id);

        const {id: connectionId, context: {id: contextId}} = connection;

        connection.removeAllEventListeners(this);

        byConnectionId.delete(connectionId);

        const dataSet = byContextId.get(contextId);
        dataSet.delete(connection);
        if (dataSet.size === 0) {
            byContextId.delete(contextId);
        }

        eventDispatcher.dispatchEvent(new ConnectionRemovedEvent(connection));
    }
}
