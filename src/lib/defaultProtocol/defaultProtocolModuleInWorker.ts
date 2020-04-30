import {ModuleConfig} from "quiver-framework";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {defaultProtocolModule} from "./defaultProtocolModule";
import {IpcMessageEvent} from "../ipcMessanger/event/IpcMessageEvent";
import {ipcMessengerInWorkerModule} from "../ipcMessanger/ipcMessengerInWorkerModule";
import {ForwardOutgoingMessage} from "./command/ForwardOutgoingMessage";
import {HandleForwardedMessage} from "./command/HandleForwardedMessage";
import {defaultProtocolId} from "./data/defaultProtocolId";

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
        {
            event: IpcMessageEvent.TYPE,
            command: HandleForwardedMessage,
            guard: ({message: {scope}}: IpcMessageEvent) => scope === defaultProtocolId
        }
    ]
};


