import {Command, Inject} from "qft";
import {IpcMessage, IpcMessageEvent, WorkerMessengerProvider} from "../../ipcMessanger";
import {DataSyncMessage, DataSyncMessageType, dataSyncMessageUtil, pocmddpProtocol} from "../../deliveryProtocol";
import {WorkerManager} from "../../workerManager/service/WorkerManager";

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
            event: {message, workerId},
            workerManager: {workerIds},
            messengerProvider: {getMessenger},
            responses
        } = this;

        const {scope, payload} = message;
        if (scope !== pocmddpProtocol) {
            return;
        }
        if (!dataSyncMessageUtil.validate(payload)) {
            return;
        }
        if (payload.type !== DataSyncMessageType.ForwardClientMessage) {
            return;
        }

        workerIds.filter(id => id !== workerId).map(id => getMessenger(id)).forEach(async ({sendAndReceive}) => {
            const {data} = await sendAndReceive<DataSyncMessage<number>>(message);
            responses.push(data);

            if (responses.length === workerIds.length - 1) {
                this.respondToActionWorker();
            }
        });
    }

    private respondToActionWorker(): void {
        const {
            event: {message, workerId},
            messengerProvider: {getMessenger},
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


