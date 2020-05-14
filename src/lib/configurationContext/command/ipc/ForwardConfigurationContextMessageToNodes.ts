import {Command, Inject} from "quiver-framework";
import {IpcMessageEvent} from "../../../ipcMessenger/event/IpcMessageEvent";
import {WorkerMessengerProvider} from "../../../ipcMessenger/service/WorkerMessengerProvider";
import {WorkerManager} from "../../../workerManager/service/WorkerManager";

export class ForwardConfigurationContextMessageToNodes implements Command {

    @Inject()
    private readonly event: IpcMessageEvent;
    @Inject()
    private readonly workerManager: WorkerManager;
    @Inject()
    private readonly messengerProvider: WorkerMessengerProvider;

    execute(): void {
        const {
            event: {message, workerId},
            workerManager: {workerIds},
            messengerProvider: {getMessenger}
        } = this;
        workerIds.filter(id => id !== workerId).map(id => getMessenger(id)).forEach(({send}) => send(message));
    }
}


