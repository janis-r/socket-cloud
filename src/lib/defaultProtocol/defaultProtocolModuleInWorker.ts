import {ModuleConfig} from "quiver-framework";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {defaultProtocolModule} from "./defaultProtocolModule";
import {IpcMessageEvent, ipcMessengerInWorkerModule} from "../ipcMessanger";
import {ForwardOutgoingMessage} from "./command/ForwardOutgoingMessage";
import {HandleForwardedMessage} from "./command/HandleForwardedMessage";

export const defaultProtocolModuleInWorker: ModuleConfig = {
    requires: [
        defaultProtocolModule,
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


