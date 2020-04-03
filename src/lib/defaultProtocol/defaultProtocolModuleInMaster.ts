import {ModuleConfig} from "quiver-framework";
import {ForwardDataSyncMessageToNodes} from "./command/ForwardDataSyncMessageToNodes";
import {IpcMessageEvent, ipcMessengerInMasterModule} from "../ipcMessanger";
import {defaultProtocolId} from "@defaultProtocol/data/defaultProtocolId";
import {DataSyncMessageType, dataSyncMessageUtil} from "@defaultProtocol/data";

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


