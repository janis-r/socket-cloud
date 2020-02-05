import {Command, Event, EventDispatcher, Inject} from "qft";
import {IpcMessage} from "../../ipcMessanger";
import {DataSyncMessage, DataSyncMessageType} from "../../deliveryProtocol/data/ipc/DataSyncMessage";
import {WorkerManager} from "../../workerManager/service/WorkerManager";
import {WorkerMessageEvent} from "../../workerManager";

type DataEvent = Event<{ message: IpcMessage<DataSyncMessage>, workerId: number }>;

export class ForwardMessageToOtherNodes implements Command {

    @Inject()
    private readonly event: WorkerMessageEvent;
    @Inject()
    private readonly workerManager: WorkerManager;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;

    execute(): Promise<void> | void {
        const {
            workerManager: {workers},
            event: {data: {message, workerId}},
            eventDispatcher
        } = this;

        console.log('>> ForwardMessageToOtherNodes');

        const responses = new Array<IpcMessage<DataSyncMessage<number>>>();

        eventDispatcher.addEventListener(WorkerMessageEvent.TYPE, (event: DataEvent) => {
            responses.push(event.data.message);
            if (responses.length === workers.length - 1) {
                eventDispatcher.removeAllEventListeners(this);

                console.log({responses});
                process.exit();
            }
        }, this).withGuards(({data: {message: {id, payload: {type}}}}) =>
            id === message.id && type === DataSyncMessageType.ClientMessageDeliveryReport
        );

        workers.filter(({id}) => id !== workerId).forEach(worker => {
            worker.send(message);
        })
    }

}


