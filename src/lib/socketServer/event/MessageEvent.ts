import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class MessageEvent extends Event {
    static readonly TYPE = Symbol('client-message');

    constructor(readonly connection: ClientConnection, readonly message: string) {
        super(MessageEvent.TYPE);
    }
}
