import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class DataEvent extends Event {
    static readonly TYPE = Symbol('client-data');

    constructor(readonly connection: ClientConnection, readonly data: Buffer) {
        super(DataEvent.TYPE);
    }
}
