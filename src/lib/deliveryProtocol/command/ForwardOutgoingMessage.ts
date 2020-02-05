import {Command, Inject} from "qft";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {IpcMessenger} from "../../ipcMessanger/service/IpcMessenger";
import {DataSyncMessage, DataSyncMessageType} from "../data/ipc/DataSyncMessage";
import {pocmddpProtocol} from "..";
import {Logger} from "../../logger";

export class ForwardOutgoingMessage implements Command {

    @Inject()
    private event: OutgoingMessageEvent;
    @Inject()
    private messenger: IpcMessenger;
    @Inject()
    private logger: Logger;

    async execute(): Promise<void> {
        const {
            event,
            event: {addRecipientProvider},
            messenger: {sendAndReceive},
            logger: {debug}
        } = this;

        let reportConnectionCount: (value: number) => void;
        addRecipientProvider(new Promise<number>(resolve => reportConnectionCount = resolve));

        const data = await sendAndReceive<number>({
            scope: pocmddpProtocol,
            payload: <DataSyncMessage>{
                type: DataSyncMessageType.ForwardClientMessage,
                data: OutgoingMessageEvent.serialize(event)
            }
        });

        debug('>> ForwardOutgoingMessage response', JSON.stringify(data, null, ' '));
        process.exit()
    }

}
