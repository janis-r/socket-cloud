import {Event} from "qft";
import {ConfigurationContext} from "../../configurationContext";
import {Socket} from "net";
import {SocketDescriptor} from "../data/SocketDescriptor";

/**
 * Event notification dispatched as new socket connection is encountered, validated and ready to be added
 * to connection pool.
 */
export class NewSocketConnectionEvent extends Event {
    static readonly TYPE = 'new-socket-connection-event';

    constructor(readonly socket: Socket, readonly descriptor: SocketDescriptor, readonly context: ConfigurationContext) {
        super(NewSocketConnectionEvent.TYPE);
    }

}
