import {Command, Inject} from "quiver-framework";
import {IpcMessageEvent} from "../../../ipcMessenger/event/IpcMessageEvent";
import {GetConnectionStatusApiIpcMessage} from "../data/ipc/GetConnectionStatusApiIpcMessage";
import {WorkerManager} from "../../../workerManager/service/WorkerManager";
import {WorkerMessengerProvider} from "../../../ipcMessenger/service/WorkerMessengerProvider";

/**
 * Handle client connection status request in master - forward message to workers until some of them
 * respond in meaningful way.
 */
export class ForwardGetStatusIpcMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent<GetConnectionStatusApiIpcMessage>;
    @Inject()
    private readonly workerManager: WorkerManager;
    @Inject()
    private readonly messengerProvider: WorkerMessengerProvider;

    async execute() {
        const {event: {message, workerId}, workerManager: {workerIds}, messengerProvider: {getMessenger}} = this;
        for (const id of workerIds) {
            if (id === workerId) {
                continue;
            }

            const response = await getMessenger(id).sendAndReceive<GetConnectionStatusApiIpcMessage>(message);
            if ("status" in response) {
                // We've got a meaningful answer
                getMessenger(workerId).send({...message, payload: response});
                return;
            }
        }

        // None of workers have returned status data - we've failed!
        const failureResponse: GetConnectionStatusApiIpcMessage = {...message.payload, status: null};
        getMessenger(workerId).send({...message, payload: failureResponse});
    }

}
