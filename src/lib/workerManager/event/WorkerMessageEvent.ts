import {Event} from "qft";

export class WorkerMessageEvent extends Event<{ message: any, workerId: number }> {

    static readonly TYPE = Symbol('worker-message-event');

    constructor(readonly message: any, readonly workerId: number) {
        super(WorkerMessageEvent.TYPE, {message, workerId});
    }
}
