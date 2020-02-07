import {ClientConnection} from "./ClientConnection";
import {ConnectionRemovedEvent, ConnectionState, ExternalId, NewConnectionEvent} from "..";
import {EventDispatcher, Injectable} from "qft";
import {ClientMessageEvent} from "../event/ClientMessageEvent";
import {ConnectionId} from "../data/ConnectionId";
import {ContextId} from "../../configurationContext";
import {Logger, LoggerEntity} from "../../logger";

@Injectable()
export class ClientConnectionPool {

    readonly log: LoggerEntity['log'];

    private readonly byConnectionId = new Map<ConnectionId, ClientConnection>();
    private readonly byContextId = new Map<ContextId, Set<ClientConnection>>();
    private readonly byContextAndExternalId = new Map<ContextId, Map<ExternalId, ClientConnection | Set<ClientConnection>>>();

    constructor(private readonly eventDispatcher: EventDispatcher, logger: Logger) {
        this.log = logger.spawnEntity('client-connection').log;
    }

    registerConnection(connection: ClientConnection): void {
        const {eventDispatcher, byConnectionId, byContextAndExternalId, byContextId, log} = this;
        const {id: connectionId, externalId, context: {id: contextId}} = connection;

        log(`New connection: #${byConnectionId.size}`, {contextId, connectionId, externalId});

        connection.addEventListener("error",
            ({data}) => log('Connection error:', {connectionId, data}),
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

    readonly getConnectionsByContext = (contextId: ContextId) => this.byContextId.get(contextId) || new Set([]);

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
        const {byConnectionId, byContextId, byContextAndExternalId, eventDispatcher, log} = this;
        const {id: connectionId, externalId, context: {id: contextId, protocol}} = connection;
        log(`Remove connection: #${byConnectionId.size}`, {contextId, connectionId, externalId});

        connection.removeAllEventListeners(this);

        // Clean byConnectionId mapping
        byConnectionId.delete(connectionId);

        // Clean byContextId mapping
        const dataSet = byContextId.get(contextId);
        dataSet.delete(connection);
        if (dataSet.size === 0) {
            byContextId.delete(contextId);
        }

        if (externalId) {
            // Clean byContextAndExternalId mapping
            const externalIdMap = byContextAndExternalId.get(contextId);
            const entry = externalIdMap.get(externalId);
            if (!(entry instanceof Set) || entry.size === 1) {
                externalIdMap.delete(externalId);
            } else {
                entry.delete(connection);
            }
        }

        eventDispatcher.dispatchEvent(new ConnectionRemovedEvent(connection));
    }
}
