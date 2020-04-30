import {ModuleConfig} from "quiver-framework";
import {ForwardDataSyncMessageToNodes} from "./command/ForwardDataSyncMessageToNodes";
import {IpcMessageEvent} from "../ipcMessanger/event/IpcMessageEvent";
import {ipcMessengerInMasterModule} from "../ipcMessanger/ipcMessengerInMasterModule";
import {defaultProtocolId} from "./data/defaultProtocolId";
import {DataSyncMessageType, dataSyncMessageUtil} from "./data/ipc/DataSyncMessage";

export const defaultProtocolModuleInMaster: ModuleConfig = {
    requires: [
        ipcMessengerInMasterModule
    ],
    commands: [
        {
            event: IpcMessageEvent.TYPE,
            command: ForwardDataSyncMessageToNodes,
            guard: ({message: {scope, payload}}: IpcMessageEvent) => scope === defaultProtocolId &&
                dataSyncMessageUtil.validate(payload) &&
                payload.type === DataSyncMessageType.ForwardClientMessage
        }
    ],
    toString: () => "deliveryProtocolOnMasterModule"
};


