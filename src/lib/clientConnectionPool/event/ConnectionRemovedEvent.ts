import {Event} from "quiver-framework";
import {ClientConnection} from "../model/ClientConnection";

/**
 * Event notification dispatched in global scope as client connection is gone
 */
export class ConnectionRemovedEvent extends Event<ClientConnection> {
    static readonly TYPE = Symbol('connection-removed');

    constructor(readonly connection: ClientConnection) {
        super(ConnectionRemovedEvent.TYPE, connection);
    }

}
