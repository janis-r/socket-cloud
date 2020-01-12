import {ClientConnection} from "./ClientConnection";
import {ConnectionRemovedEvent, ConnectionState, ExternalId, NewConnectionEvent} from "..";
import {EventDispatcher, Inject} from "qft";
import {ClientMessageEvent} from "../event/ClientMessageEvent";
import chalk from "chalk";
import {ConnectionId} from "../data/ConnectionId";
import {ContextId} from "../../configurationContext";

export class ClientConnectionPool {

    @Inject()
    private eventDispatcher: EventDispatcher;

    private readonly byConnectionId = new Map<ConnectionId, ClientConnection>();
    private readonly byContextId = new Map<ContextId, Set<ClientConnection>>();
    private readonly byContextAndExternalId = new Map<ContextId, Map<ExternalId, ClientConnection | Set<ClientConnection>>>();

    registerConnection(connection: ClientConnection): void {
        const {eventDispatcher, byConnectionId, byContextAndExternalId, byContextId} = this;
        const {id: connectionId, externalId, context: {id: contextId}} = connection;

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

        if (externalId) {
            if (!byContextAndExternalId.has(contextId)) {
                byContextAndExternalId.set(contextId, new Map<ClientConnection["externalId"], ClientConnection>());
            }

            const externalIdMap = byContextAndExternalId.get(contextId);
            if (!externalIdMap.has(externalId)) {
                externalIdMap.set(externalId, connection)
            } else {
                const entry = externalIdMap.get(externalId);
                if (entry instanceof Set) {
                    entry.add(connection);
                } else {
                    externalIdMap.set(externalId, new Set([entry, connection]));
                }
            }
        }
        eventDispatcher.dispatchEvent(new NewConnectionEvent(connection));
    }

    readonly getConnectionsByContext = (contextId: ContextId) => this.byContextId.get(contextId) ?? null;

    readonly getConnectionsByContextAndExternalId = (contextId: ContextId, externalId: ExternalId): Array<ClientConnection> => {
        const {byContextAndExternalId} = this;
        if (!byContextAndExternalId.has(contextId)) {
            return [];
        }
        const externalIdMap = byContextAndExternalId.get(contextId);
        if (!externalIdMap.has(externalId)) {
            return [];
        }
        const entry = externalIdMap.get(externalId);
        return entry instanceof Set ? [...entry] : [entry];
    };

    private removeConnection(connection: ClientConnection): void {
        const {byConnectionId, byContextId, byContextAndExternalId, eventDispatcher} = this;

        console.log(chalk.red('Remove connection'), connection.id);

        const {id: connectionId, externalId, context: {id: contextId, protocol}} = connection;

        connection.removeAllEventListeners(this);

        // Clean byConnectionId mapping
        byConnectionId.delete(connectionId);

        // Clean byContextId mapping
        const dataSet = byContextId.get(contextId);
        dataSet.delete(connection);
        if (dataSet.size === 0) {
            byContextId.delete(contextId);
        }

        // Clean byContextAndExternalId mapping
        const externalIdMap = byContextAndExternalId.get(contextId);
        const entry = externalIdMap.get(externalId);
        if (!(entry instanceof Set) || entry.size === 1) {
            externalIdMap.get(externalId);
        } else {
            entry.delete(connection);
        }

        eventDispatcher.dispatchEvent(new ConnectionRemovedEvent(connection));
    }
}
