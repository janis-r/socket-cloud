import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class MessageEvent extends Event<string> {
    static readonly TYPE = "message";

    constructor(readonly connection: ClientConnection, readonly message: string) {
        super(MessageEvent.TYPE, message);
    }
}
