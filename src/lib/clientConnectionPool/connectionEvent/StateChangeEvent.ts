import {Event} from "quiver-framework";
import {ClientConnection} from "../model/ClientConnection";
import {ConnectionState} from "..";

export class StateChangeEvent extends Event<ConnectionState> {
    static readonly TYPE = "state-change";

    constructor(readonly connection: ClientConnection, readonly prevState: ConnectionState) {
        super(StateChangeEvent.TYPE, prevState);
    }
}
