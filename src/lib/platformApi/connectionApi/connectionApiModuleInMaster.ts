import { ModuleConfig } from "quiver-framework";
import { IpcMessageEvent } from "../../ipcMessenger/event/IpcMessageEvent";
import { connectionApiIpcScope } from "./data/ipc/connectionApiIpcScope";
import { getStatusConnectionApiIpcMessageValidator } from "./data/ipc/GetConnectionStatusApiIpcMessage";
import { ipcMessengerInMasterModule } from "../../ipcMessenger/ipcMessengerInMasterModule";
import { ForwardGetStatusIpcMessage } from "./command/ForwardGetStatusIpcMessage";
import { ForwardDropConnectionIpcMessage } from "./command/ForwardDropConnectionIpcMessage";
import { dropConnectionApiIpcMessageValidator } from "./data/ipc/DropConnectionApiIpcMessage";

export const connectionApiModuleInMaster: ModuleConfig = {
    requires: [
        ipcMessengerInMasterModule
    ],
    commands: [
        {
            event: IpcMessageEvent.TYPE,
            command: ForwardGetStatusIpcMessage,
            guard: ({ message: { scope, payload } }: IpcMessageEvent) =>
                scope === connectionApiIpcScope &&
                getStatusConnectionApiIpcMessageValidator.validate(payload)
        },
        {
            event: IpcMessageEvent.TYPE,
            command: ForwardDropConnectionIpcMessage,
            guard: ({ message: { scope, payload } }: IpcMessageEvent) =>
                scope === connectionApiIpcScope &&
                dropConnectionApiIpcMessageValidator.validate(payload)
        }
    ]
}
