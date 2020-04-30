import {Command, Inject} from "quiver-framework";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {DataSyncMessage, DataSyncMessageType} from "../data/ipc/DataSyncMessage";
import {defaultProtocolId} from "../data/defaultProtocolId";
import {IpcMessenger} from "../../ipcMessanger/service/IpcMessenger";

/**
 * Forward outgoing message to other IPC communication parties.
 */
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
            const {data} = await sendAndReceive<DataSyncMessage<number>>({
                scope: defaultProtocolId,
                payload: {
                    type: DataSyncMessageType.ForwardClientMessage,
                    data: OutgoingMessageEvent.serialize(event)
                }
            });
            resolve(data);
        }));
    }
}
