import {ModuleConfig} from "quiver-framework";
import {DeleteConfigurationContextEvent} from "./event/DeleteConfigurationContextEvent";
import {UpdateConfigurationContextEvent} from "./event/UpdateConfigurationContextEvent";
import {configurationContextModule} from "./configurationContextModule";
import {ForwardConfigurationContextMessageToMaster} from "./command/ipc/ForwardConfigurationContextMessageToMaster";
import {IpcMessageEvent} from "../ipcMessanger";
import {configurationContextIpcScope} from "./data/ipc/configurationContextIpcScope";
import {ForwardConfigurationContextMessageWithinWorker} from "./command/ipc/ForwardConfigurationContextMessageWithinWorker";

export const configurationContextModuleInWorker: ModuleConfig = {
    requires: [
        configurationContextModule
    ],
    commands: [
        {
            event: DeleteConfigurationContextEvent.TYPE,
            command: ForwardConfigurationContextMessageToMaster,
            guard: ({isForwarded}: DeleteConfigurationContextEvent) => !isForwarded
        },
        {
            event: UpdateConfigurationContextEvent.TYPE,
            command: ForwardConfigurationContextMessageToMaster,
            guard: ({isForwarded}: UpdateConfigurationContextEvent) => !isForwarded
        },
        {
            event: IpcMessageEvent.TYPE,
            command: ForwardConfigurationContextMessageWithinWorker,
            guard: ({message: {scope}}: IpcMessageEvent) => scope === configurationContextIpcScope
        }
    ]
}
