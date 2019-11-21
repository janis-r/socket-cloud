import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class ConnectionCloseEvent extends Event {
    static readonly TYPE = Symbol('close');

    constructor(readonly connection: ClientConnection, readonly reason?:string) {
        super(ConnectionCloseEvent.TYPE);
    }
}
