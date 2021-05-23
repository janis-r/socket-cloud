import { Command, EventDispatcher, Inject } from "quiver-framework";
import { OutgoingMessageEvent } from "../event/OutgoingMessageEvent";
import { IpcMessage, ipcMessageUtil } from "../../ipcMessenger/data/IpcMessage";
import { IpcMessageEvent } from "../../ipcMessenger/event/IpcMessageEvent";
import { IpcMessenger } from "../../ipcMessenger/service/IpcMessenger";
import { DataSyncMessage, DataSyncMessageType, dataSyncMessageUtil } from "../data/ipc/DataSyncMessage";

export class HandleForwardedMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;
    @Inject()
    private readonly messenger: IpcMessenger;

    async execute(): Promise<void> {
        const { eventDispatcher, event: { message }, messenger: { send } } = this;

        if (!ipcMessageUtil.validate(message)) {
            throw new Error('Invalid IPC message');
        }

        const { payload } = message;
        if (!dataSyncMessageUtil.validate(payload)) {
            throw new Error('Invalid IPC data sync message');
        }

        const outgoingEvent = OutgoingMessageEvent.unserialize(payload.data);
        outgoingEvent.forwarded();

        eventDispatcher.dispatchEvent(outgoingEvent);
        const recipients = await outgoingEvent.getRecipientCount();

        const response: IpcMessage<DataSyncMessage<number>> = {
            ...message,
            payload: {
                type: DataSyncMessageType.ClientMessageDeliveryReport,
                data: recipients
            }
        };
        send(response);
    }

}
