import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class ConnectionErrorEvent extends Event {
    static readonly TYPE = Symbol('client-connection-error');

    constructor(readonly connection: ClientConnection, readonly message?: string) {
        super(ConnectionErrorEvent.TYPE);
    }
}
