import {Command, EventDispatcher, Inject} from "qft";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {IpcMessageEvent} from "../../ipcMessanger";
import {pocmddpProtocol} from "..";
import {DataSyncMessage, DataSyncMessageType} from "../data/ipc/DataSyncMessage";
import {Logger} from "../../logger";

export class HandleForwardedMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;
    @Inject()
    private readonly logger: Logger;

    async execute(): Promise<void> {
        const {eventDispatcher, event: {message: {payload: {data}}, respond}, logger: {debug}} = this;
        const outgoingEvent = OutgoingMessageEvent.unserialize(data);
        outgoingEvent.forwarded();

        debug(`>> HandleForwardedMessage`, data);
        eventDispatcher.dispatchEvent(outgoingEvent);
        const recipients = await outgoingEvent.getRecipientCount();

        respond({
            scope: pocmddpProtocol,
            payload: <DataSyncMessage>{
                type: DataSyncMessageType.ClientMessageDeliveryReport,
                data: recipients
            }
        });
    }

}
