import {Event} from "quiver-framework";
import {ClientMessage} from "../data/clientMessage/ClientMessage";
import {ClientConnection} from "../../clientConnectionPool/model/ClientConnection";

export class IncomingClientMessageEvent extends Event<{connection: ClientConnection, message: ClientMessage}> {
    static readonly TYPE = Symbol("incoming-client-message");

    constructor(readonly connection: ClientConnection, readonly message: ClientMessage) {
        super(IncomingClientMessageEvent.TYPE, {connection, message});
    }
}
