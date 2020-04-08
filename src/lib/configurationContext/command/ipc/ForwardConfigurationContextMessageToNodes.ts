import {Command, Inject} from "quiver-framework";
import {IpcMessageEvent, WorkerMessengerProvider} from "../../../ipcMessanger";
import {WorkerManager} from "../../../workerManager";

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


