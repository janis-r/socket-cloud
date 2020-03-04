import {Event} from "quiver-framework";
import {IpcMessage} from "../data/IpcMessage";

export class IpcMessageEvent extends Event {

    static readonly TYPE = Symbol('ipc-message-event');

    constructor(readonly message: IpcMessage, readonly workerId?: number) {
        super(IpcMessageEvent.TYPE, message);
    }
}
