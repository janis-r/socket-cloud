import {ModuleConfig} from "quiver-framework";
import {configurationContextModule} from "./configurationContextModule";
import {DeleteConfigurationContextEvent} from "./event/DeleteConfigurationContextEvent";
import {UpdateConfigurationContextEvent} from "./event/UpdateConfigurationContextEvent";
import {ForwardConfigurationContextMessageToMaster} from "./command/ipc/ForwardConfigurationContextMessageToMaster";
import {IpcMessageEvent} from "../ipcMessanger/event/IpcMessageEvent";
import {configurationContextIpcScope} from "./data/ipc/configurationContextIpcScope";
import {ForwardConfigurationContextMessageWithinWorker} from "./command/ipc/ForwardConfigurationContextMessageWithinWorker";

export const configurationContextModuleInWorker: ModuleConfig = {
    requires: [
        configurationContextModule // TODO A MAJOR FUCKUP IF THIS LINE STAYS COMMENTED
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
};
