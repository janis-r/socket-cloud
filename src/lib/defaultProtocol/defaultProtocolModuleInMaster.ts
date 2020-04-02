import {ModuleConfig} from "quiver-framework";
import {ForwardDataSyncMessageToNodes} from "./command/ForwardDataSyncMessageToNodes";
import {IpcMessageEvent, ipcMessengerInMasterModule} from "../ipcMessanger";

export const defaultProtocolModuleInMaster: ModuleConfig = {
    requires: [
        ipcMessengerInMasterModule
    ],
    commands: [
        {event: IpcMessageEvent.TYPE, command: ForwardDataSyncMessageToNodes}
    ],
    toString: () => "deliveryProtocolOnMasterModule"
};

