import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class ClientMessageEvent extends Event {
    static readonly TYPE = Symbol('message');

    constructor(readonly connection: ClientConnection, readonly message: string) {
        super(ClientMessageEvent.TYPE);
    }
}
