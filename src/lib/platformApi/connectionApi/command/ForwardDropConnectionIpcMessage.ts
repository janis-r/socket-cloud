import {Command, Inject} from "quiver-framework";
import {IpcMessageEvent} from "../../../ipcMessenger/event/IpcMessageEvent";
import {DropConnectionApiIpcMessage} from "../data/ipc/DropConnectionApiIpcMessage";
import {WorkerManager} from "../../../workerManager/service/WorkerManager";
import {WorkerMessengerProvider} from "../../../ipcMessenger/service/WorkerMessengerProvider";

/**
 * Handle drop client connection request in master - forward message to workers until some of them
 * respond with success.
 */
export class ForwardDropConnectionIpcMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent<DropConnectionApiIpcMessage>;
    @Inject()
    private readonly workerManager: WorkerManager;
    @Inject()
    private readonly messengerProvider: WorkerMessengerProvider;

    async execute() {
        const {event: {message, workerId}, workerManager: {workerIds}, messengerProvider: {getMessenger}} = this;

        for (const id of workerIds.filter(id => id !== workerId)) {
            const response = await getMessenger(id).sendAndReceive<DropConnectionApiIpcMessage>(message);
            if (response.success) {
                // We've got a winner
                getMessenger(workerId).send({...message, payload: response});
                return;
            }
        }

        // None of workers have reported that connection is dropped - we've failed!
        const failureResponse: DropConnectionApiIpcMessage = {...message.payload, success: false};
        getMessenger(workerId).send({...message, payload: failureResponse});
    }

}
