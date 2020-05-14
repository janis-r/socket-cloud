import {ModuleConfig} from "quiver-framework";
import {IpcMessageEvent} from "../ipcMessenger/event/IpcMessageEvent";
import {configurationContextIpcScope} from "./data/ipc/configurationContextIpcScope";
import {ForwardConfigurationContextMessageToNodes} from "./command/ipc/ForwardConfigurationContextMessageToNodes";

export const configurationContextModuleInMaster: ModuleConfig = {
    commands: [
        {
            event: IpcMessageEvent.TYPE,
            command: ForwardConfigurationContextMessageToNodes           ,
            guard: ({message: {scope}}: IpcMessageEvent) => scope === configurationContextIpcScope
        }
    ],
};
