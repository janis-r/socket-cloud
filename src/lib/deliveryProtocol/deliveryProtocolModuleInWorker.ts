import {ModuleConfig} from "qft";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {deliveryProtocolModule} from "./deliveryProtocolModule";
import {ipcMessengerInWorkerModule} from "../ipcMessanger/ipcMessengerInWorkerModule";
import {ForwardOutgoingMessage} from "./command/ForwardOutgoingMessage";
import {IpcMessageEvent} from "../ipcMessanger";
import {HandleForwardedMessage} from "./command/HandleForwardedMessage";

export const deliveryProtocolModuleInWorker: ModuleConfig = {
    requires: [
        deliveryProtocolModule,
        ipcMessengerInWorkerModule
    ],
    commands: [
        {
            event: OutgoingMessageEvent.TYPE,
            command: ForwardOutgoingMessage,
            guard: ({isForwarded}: OutgoingMessageEvent) => !isForwarded
        },
        {event: IpcMessageEvent.TYPE, command: HandleForwardedMessage}
    ]
};


