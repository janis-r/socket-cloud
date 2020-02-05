import {Command, Inject} from "qft";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {IpcMessenger} from "../../ipcMessanger/service/IpcMessenger";
import {DataSyncMessage, DataSyncMessageType} from "../data/ipc/DataSyncMessage";
import {pocmddpProtocol} from "..";

export class ForwardOutgoingMessage implements Command {

    @Inject()
    private event: OutgoingMessageEvent;
    @Inject()
    private messenger: IpcMessenger;

    async execute(): Promise<void> {
        const {
            event,
            event: {addRecipientProvider},
            messenger: {sendAndReceive}
        } = this;


        addRecipientProvider(new Promise<number>(async resolve => {
            const {data} = await sendAndReceive<DataSyncMessage>({
                scope: pocmddpProtocol,
                payload: <DataSyncMessage>{
                    type: DataSyncMessageType.ForwardClientMessage,
                    data: OutgoingMessageEvent.serialize(event)
                }
            });
            resolve(data);
        }));
    }
}
