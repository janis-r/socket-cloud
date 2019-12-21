import {Event} from "qft";
import {ClientConnection} from "../index";

/**
 * Event notification dispatched in global scope as new client connection is encountered, validated and ready to be
 * user.
 */
export class NewConnectionEvent extends Event {
    static readonly TYPE = Symbol('new-connection-event');

    constructor(readonly connection: ClientConnection) {
        super(NewConnectionEvent.TYPE);
    }

}
