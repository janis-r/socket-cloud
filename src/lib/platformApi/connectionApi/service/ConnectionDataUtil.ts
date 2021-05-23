import { Inject } from "quiver-framework";
import { ClientConnectionPool } from "../../../clientConnectionPool/model/ClientConnectionPool";
import { ConnectionStatus } from "../data/ConnectionStatus";
import { ConnectionId } from "../../../clientConnectionPool/data/ConnectionId";
import { ConnectionState } from "../../../clientConnectionPool/data/ConnectionState";
import { CloseReason } from "../../../clientConnectionPool/data/CloseReason";
import { connectionToConnectionStatus } from "../util/connectionToConnectionStatus";
import cluster from "cluster";

export class ConnectionDataUtil {

    @Inject()
    private readonly clientConnectionPool: ClientConnectionPool;

    async getConnectionStatus(connectionId: ConnectionId): Promise<ConnectionStatus | null> {
        const { clientConnectionPool: { getConnectionById } } = this;
        const connection = getConnectionById(connectionId);
        if (connection) {
            return connectionToConnectionStatus(connection);
        }
        return null;
    }


    async dropClientConnection(connectionId: ConnectionId, reason?: string): Promise<boolean> {
        const { clientConnectionPool: { getConnectionById } } = this;

        const connection = getConnectionById(connectionId);
        if (connection && [ConnectionState.Connecting, ConnectionState.Open].includes(connection.state)) {
            connection.close(CloseReason.NormalClosure, reason);
            return true;
        }

        return false;
    }

}
