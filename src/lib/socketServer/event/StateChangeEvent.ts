import {Event} from "qft";
import {ClientConnection} from "../model/ClientConnection";
import {ConnectionState} from "..";

export class StateChangeEvent extends Event {
    static readonly TYPE = Symbol('state-change');

    constructor(readonly connection: ClientConnection, readonly prevState: ConnectionState) {
        super(StateChangeEvent.TYPE);
    }
}
