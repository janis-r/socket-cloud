import {Command, EventDispatcher, Inject} from "quiver-framework";
import {WorkerMessageEvent} from "../../workerManager/event/WorkerMessageEvent";
import {IpcMessageEvent} from "../event/IpcMessageEvent";
import {ipcMessageUtil} from "../data/IpcMessage";

export class CreateIpcMessageEvent implements Command {

    @Inject()
    private readonly event: WorkerMessageEvent;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;

    execute(): void {
        const {event: {workerId, message}, eventDispatcher} = this;
        if (ipcMessageUtil.validate(message)) {
            eventDispatcher.dispatchEvent(new IpcMessageEvent(message, workerId));
        }
    }

}
