import { Command, Inject } from "quiver-framework";
import { IpcMessage } from "../../ipcMessenger/data/IpcMessage";
import { IpcMessageEvent } from "../../ipcMessenger/event/IpcMessageEvent";
import { WorkerMessengerProvider } from "../../ipcMessenger/service/WorkerMessengerProvider";
import { DataSyncMessage, DataSyncMessageType } from "../data/ipc/DataSyncMessage";
import { WorkerManager } from "../../workerManager/service/WorkerManager";

export class ForwardDataSyncMessageToNodes implements Command {

    @Inject()
    private readonly event: IpcMessageEvent;
    @Inject()
    private readonly workerManager: WorkerManager;
    @Inject()
    private readonly messengerProvider: WorkerMessengerProvider;

    private readonly responses = new Array<number>();

    execute(): void {
        const {
            event: { message, workerId },
            workerManager: { workerIds },
            messengerProvider: { getMessenger },
            responses
        } = this;

        workerIds.filter(id => id !== workerId).map(id => getMessenger(id)).forEach(async ({ sendAndReceive }) => {
            const { data } = await sendAndReceive<DataSyncMessage<number>>(message);
            responses.push(data);

            if (responses.length === workerIds.length - 1) {
                this.respondToActionWorker();
            }
        });
    }

    private respondToActionWorker(): void {
        const {
            event: { message, workerId },
            messengerProvider: { getMessenger },
            responses
        } = this;

        const accumulated = responses.reduce((prev, cur) => prev + cur);
        const responseMessage: IpcMessage<DataSyncMessage<number>> = {
            ...message,
            payload: {
                type: DataSyncMessageType.ClientMessageDeliveryReport,
                data: accumulated
            }
        };
        getMessenger(workerId).send(responseMessage);
    }

}


