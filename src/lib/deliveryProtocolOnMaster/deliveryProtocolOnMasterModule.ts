import {ModuleConfig} from "qft";
import {ForwardMessageToOtherNodes} from "./command/ForwardMessageToOtherNodes";
import {workerManagerModule, WorkerMessageEvent} from "../workerManager";
import {ipcMessageUtil} from "../ipcMessanger";
import {pocmddpProtocol} from "../deliveryProtocol";
import {DataSyncMessageType, dataSyncMessageUtil} from "../deliveryProtocol/data/ipc/DataSyncMessage";

export const deliveryProtocolOnMasterModule: ModuleConfig = {
    requires: [
        workerManagerModule
    ],
    commands: [
        {
            event: WorkerMessageEvent.TYPE,
            command: ForwardMessageToOtherNodes,
            guard: ({data: {message}}: WorkerMessageEvent) => {
                if (!ipcMessageUtil.validate(message)) {
                    return false;
                }
                const {scope, payload} = message;
                if (scope !== pocmddpProtocol) {
                    return false;
                }

                if (!dataSyncMessageUtil.validate(payload)) {
                    return false;
                }
                if (payload.type !== DataSyncMessageType.ForwardClientMessage) {
                    return false;
                }
                return true;
            }
        }
    ]
};


