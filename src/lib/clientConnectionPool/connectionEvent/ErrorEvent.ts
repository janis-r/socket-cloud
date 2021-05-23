import { Event } from "quiver-framework";
import { ClientConnection } from "../model/ClientConnection";

export class ErrorEvent extends Event<{ message: string, code?: any }> {
    static readonly TYPE = "error";

    constructor(readonly connection: ClientConnection,
        readonly message: string,
        readonly code?: any
    ) {
        super(ErrorEvent.TYPE, { message, code });
    }
}
