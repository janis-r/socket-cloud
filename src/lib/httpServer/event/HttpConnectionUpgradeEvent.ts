import {Event} from "quiver-framework";
import {Socket} from "net";
import {UpgradeRequest} from "..";

export class HttpConnectionUpgradeEvent extends Event {
    static readonly TYPE = Symbol('http-connection-upgrade-event');

    constructor(readonly request: UpgradeRequest, readonly socket: Socket) {
        super(HttpConnectionUpgradeEvent.TYPE);
    }
}



