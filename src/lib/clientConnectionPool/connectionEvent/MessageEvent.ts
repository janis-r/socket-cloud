import { Event } from "quiver-framework";
import { ClientConnection } from "../model/ClientConnection";

export class MessageEvent extends Event<string | Buffer> {
    static readonly TYPE = "message";

    constructor(readonly connection: ClientConnection, readonly message: string | Buffer) {
        super(MessageEvent.TYPE, message);
    }
}