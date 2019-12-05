import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class ErrorEvent extends Event {
    static readonly TYPE = Symbol('client-connection-error');

    constructor(readonly connection: ClientConnection,
                readonly message: string,
                readonly code?: any
    ) {
        super(ErrorEvent.TYPE);
    }
}
