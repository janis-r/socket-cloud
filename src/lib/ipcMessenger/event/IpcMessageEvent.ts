import { Event } from "quiver-framework";
import { IpcMessage } from "../data/IpcMessage";

/**
 * @template P IpcMessage payload data type
 */
export class IpcMessageEvent<P = any> extends Event {

    static readonly TYPE = Symbol('ipc-message-event');

    constructor(readonly message: IpcMessage<P>, readonly workerId?: number) {
        super(IpcMessageEvent.TYPE, message);
    }
}
