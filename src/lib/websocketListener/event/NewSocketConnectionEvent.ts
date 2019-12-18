import {Event} from "qft";
import {WebsocketClientConnection} from "../model/WebsocketClientConnection";

/**
 * Event notification dispatched as new socket connection is encountered, validated and ready to be added
 * to connection pool.
 */
export class NewSocketConnectionEvent extends Event {
    static readonly TYPE = Symbol('new-socket-connection-event');

    constructor(readonly connection: WebsocketClientConnection) {
        super(NewSocketConnectionEvent.TYPE);
    }

}
