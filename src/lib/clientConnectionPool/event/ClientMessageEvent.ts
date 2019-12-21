import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class ClientMessageEvent extends Event<string | Buffer> {
    static readonly TYPE = Symbol("client-message");

    constructor(readonly connection: ClientConnection, readonly message: string | Buffer) {
        super(ClientMessageEvent.TYPE, message);
    }
}
