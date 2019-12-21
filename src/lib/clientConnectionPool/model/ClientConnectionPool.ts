import {ClientConnection} from "./ClientConnection";
import {ConnectionState, NewConnectionEvent} from "..";
import {EventDispatcher, Inject} from "qft";
import {ClientMessageEvent} from "../event/ClientMessageEvent";
import {StateChangeEvent} from "../connectionEvent";

export class ClientConnectionPool {

    @Inject()
    private eventDispatcher: EventDispatcher;

    private readonly byContextId = new Map<ClientConnection['context']['id'], Set<ClientConnection>>();

    registerConnection(connection: ClientConnection): void {
        const {eventDispatcher, byContextId} = this;
        const contextId = connection.context.id;
        connection.addEventListener("state-change", ({connection}) => this.removeConnection(connection)).withGuards(
            ({connection: {state}}: StateChangeEvent) => state >= ConnectionState.Closing
        ).once();

        if (!byContextId.has(contextId)) {
            byContextId.set(contextId, new Set<ClientConnection>([connection]));
        } else {
            byContextId.get(contextId).add(connection);
        }

        connection.addEventListener("message", ({connection, message}) => eventDispatcher.dispatchEvent(
            new ClientMessageEvent(connection, message))
        );

        eventDispatcher.dispatchEvent(new NewConnectionEvent(connection));
    }

    private removeConnection(connection: ClientConnection): void {
        const {byContextId} = this;
        const contextId = connection.context.id;
        const dataSet = byContextId.get(contextId);
        dataSet.delete(connection);
        if (dataSet.size === 0) {
            byContextId.delete(contextId);
        }
    }
}
