import {Command, EventDispatcher, Inject} from "quiver-framework";
import {WorkerMessageEvent} from "../../workerManager";
import {IpcMessageEvent, ipcMessageUtil} from "..";

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
