import {Command, EventDispatcher, Inject} from "qft";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {IpcMessage, IpcMessageEvent, ipcMessageUtil} from "../../ipcMessanger";
import {DataSyncMessage, DataSyncMessageType, dataSyncMessageUtil} from "../data/ipc/DataSyncMessage";
import {Logger} from "../../logger";

export class HandleForwardedMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;
    @Inject()
    private readonly logger: Logger;

    async execute(): Promise<void> {
        const {eventDispatcher, event: {message, respond}, logger: {debug}} = this;

        if (!ipcMessageUtil.validate(message)) {
            throw new Error('Invalid IPC message');
        }

        const {id, scope, payload} = message;
        if (!dataSyncMessageUtil.validate(payload)) {
            throw new Error('Invalid IPC data sync message');
        }

        const outgoingEvent = OutgoingMessageEvent.unserialize(payload.data);
        outgoingEvent.forwarded();

        eventDispatcher.dispatchEvent(outgoingEvent);
        const recipients = await outgoingEvent.getRecipientCount();

        respond(<IpcMessage>{
            payload: <DataSyncMessage>{
                type: DataSyncMessageType.ClientMessageDeliveryReport,
                data: recipients
            }
        });
    }

}
