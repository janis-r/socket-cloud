import { Event } from "quiver-framework";
import { ClientConnection } from "../model/ClientConnection";


/**
 * Event notification dispatched in global scope as new client connection is encountered, validated and ready to be
 * user.
 */
export class NewConnectionEvent extends Event<ClientConnection> {
    static readonly TYPE = Symbol('new-connection-event');

    constructor(readonly connection: ClientConnection) {
        super(NewConnectionEvent.TYPE, connection);
    }

}
