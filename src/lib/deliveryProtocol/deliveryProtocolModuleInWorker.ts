import {ModuleConfig} from "qft";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {deliveryProtocolModule} from "./deliveryProtocolModule";
import {ipcMessengerModule} from "../ipcMessanger/ipcMessengerModule";
import {ForwardOutgoingMessage} from "./command/ForwardOutgoingMessage";
import {IpcMessageEvent} from "../ipcMessanger";
import {HandleForwardedMessage} from "./command/HandleForwardedMessage";

export const deliveryProtocolModuleInWorker: ModuleConfig = {
    requires: [
        deliveryProtocolModule,
        ipcMessengerModule
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


