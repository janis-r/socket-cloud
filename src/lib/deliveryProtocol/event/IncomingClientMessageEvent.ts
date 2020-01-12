import {Event} from "qft";
import {IncomingClientMessage} from "../data";
import {ClientConnection} from "../../clientConnectionPool";

export class IncomingClientMessageEvent extends Event<{connection: ClientConnection, message: IncomingClientMessage}> {
    static readonly TYPE = Symbol("incoming-client-message");

    constructor(readonly connection: ClientConnection, readonly message: IncomingClientMessage) {
        super(IncomingClientMessageEvent.TYPE, {connection, message});
    }
}
