import {ModuleConfig} from "quiver-framework";
import {ConnectionDataUtil} from "./service/ConnectionDataUtil";
import {connectionApiModule} from "./connectionApiModule";
import {ConnectionDataUtilInWorker} from "./service/ConnectionDataUtilInWorker";
import {ipcMessengerInWorkerModule} from "../../ipcMessenger/ipcMessengerInWorkerModule";
import {IpcMessageEvent} from "../../ipcMessenger/event/IpcMessageEvent";
import {connectionApiIpcScope} from "./data/ipc/connectionApiIpcScope";
import {HandleForwardedGetStatusIpcMessage} from "./command/HandleForwardedGetStatusIpcMessage";
import {getStatusConnectionApiIpcMessageValidator} from "./data/ipc/GetConnectionStatusApiIpcMessage";
import {HandleForwardedDropConnectionIpcMessage} from "./command/HandleForwardedDropConnectionIpcMessage";
import {dropConnectionApiIpcMessageValidator} from "./data/ipc/DropConnectionApiIpcMessage";

export const connectionApiModuleInWorker: ModuleConfig = {
    requires: [
        connectionApiModule,
        ipcMessengerInWorkerModule
    ],
    mappings: [
        {map: ConnectionDataUtil, useType: ConnectionDataUtilInWorker}
    ],
    commands: [
        {
            event: IpcMessageEvent.TYPE,
            command: HandleForwardedGetStatusIpcMessage,
            guard: ({message: {scope, payload}}: IpcMessageEvent) =>
                scope === connectionApiIpcScope && getStatusConnectionApiIpcMessageValidator.validate(payload)
        },
        {
            event: IpcMessageEvent.TYPE,
            command: HandleForwardedDropConnectionIpcMessage,
            guard: ({message: {scope, payload}}: IpcMessageEvent) =>
                scope === connectionApiIpcScope && dropConnectionApiIpcMessageValidator.validate(payload)
        },
    ]
}
