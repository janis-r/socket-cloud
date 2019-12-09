import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";

export class DataEvent extends Event<Buffer> {
    static readonly TYPE = "data";

    constructor(readonly connection: ClientConnection, readonly data: Buffer) {
        super(DataEvent.TYPE, data);
    }
}
