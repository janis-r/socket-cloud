import {Inject} from "quiver-framework";
import {ConnectionDataUtil} from "./ConnectionDataUtil";
import {ConnectionId} from "../../../clientConnectionPool/data/ConnectionId";
import {ConnectionStatus} from "../data/ConnectionStatus";
import {IpcMessenger} from "../../../ipcMessenger/service/IpcMessenger";
import {DropConnectionApiIpcMessage} from "../data/ipc/DropConnectionApiIpcMessage";
import {connectionApiIpcScope} from "../data/ipc/connectionApiIpcScope";
import {ConnectionApiIpcMessageType} from "../data/ipc/ConnectionApiIpcMessageType";
import {GetConnectionStatusApiIpcMessage} from "../data/ipc/GetConnectionStatusApiIpcMessage";
import cluster from "cluster";

export class ConnectionDataUtilInWorker extends ConnectionDataUtil {

    @Inject()
    private readonly messenger: IpcMessenger;

    async getConnectionStatus(connectionId: ConnectionId): Promise<ConnectionStatus | null> {
        const status = await super.getConnectionStatus(connectionId);
        if (status) {
            return status;
        }

        const {messenger: {sendAndReceive}} = this;
        const response = await sendAndReceive<GetConnectionStatusApiIpcMessage>({
            scope: connectionApiIpcScope,
            payload: {
                type: ConnectionApiIpcMessageType.GetStatus,
                connectionId
            }
        });
        return response.status ?? null;
    }

    async dropClientConnection(connectionId: ConnectionId, reason?: string): Promise<boolean> {
        const connectionFound = await super.dropClientConnection(connectionId, reason);
        if (connectionFound) {
            return connectionFound;
        }

        const {messenger: {sendAndReceive}} = this;
        const {success} = await sendAndReceive<DropConnectionApiIpcMessage>({
            scope: connectionApiIpcScope,
            payload: {
                type: ConnectionApiIpcMessageType.DropConnection,
                connectionId
            }
        });

        return success;
    }
}
