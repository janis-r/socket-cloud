import {ModuleConfig} from "qft";
import {ForwardDataSyncMessageToNodes} from "./command/ForwardDataSyncMessageToNodes";
import {IpcMessageEvent, ipcMessengerInMasterModule} from "../ipcMessanger";

export const deliveryProtocolOnMasterModule: ModuleConfig = {
    requires: [
        ipcMessengerInMasterModule
    ],
    commands: [
        {event: IpcMessageEvent.TYPE, command: ForwardDataSyncMessageToNodes}
    ],
    toString: () => "deliveryProtocolOnMasterModule"
};


