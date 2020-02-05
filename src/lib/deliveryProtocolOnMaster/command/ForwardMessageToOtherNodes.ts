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

        const responses = new Array<IpcMessage<DataSyncMessage<number>>>();
        // TODO: This event listener construction does not seem nice!
        eventDispatcher.addEventListener(WorkerMessageEvent.TYPE, (event: DataEvent) => {
            responses.push(event.data.message);
            if (responses.length === workers.length - 1) {
                eventDispatcher.removeAllEventListeners(this);
                const accumulated = responses.map(msg => msg.payload.data).reduce((prev, cur) => prev + cur);
                workers.find(({id}) => id === workerId).send({
                    id: (<IpcMessage>message).id,
                    scope: (<IpcMessage>message).scope,
                    payload: <DataSyncMessage>{
                        type: DataSyncMessageType.ClientMessageDeliveryReport,
                        data: accumulated
                    }
                });
            }
        }, this).withGuards(({data: {message: {id, payload: {type}}}}) =>
            id === message.id && type === DataSyncMessageType.ClientMessageDeliveryReport
        );

        workers.filter(({id}) => id !== workerId).forEach(worker => {
            worker.send(message);
        });
    }

}


