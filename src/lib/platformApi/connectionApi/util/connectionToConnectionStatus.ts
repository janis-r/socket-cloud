import {toSeconds} from "ugd10a";
import {ClientConnection} from "../../../clientConnectionPool/model/ClientConnection";
import {ConnectionStatus} from "../data/ConnectionStatus";

export function connectionToConnectionStatus(connection: ClientConnection): ConnectionStatus {
    const {id: connectionId, externalId, created, bytesReceived, bytesSent} = connection;
    const status: ConnectionStatus = {
        connectionId,
        uptime: toSeconds(Date.now() - created.getTime(), "milliseconds"),
        bytesSent,
        bytesReceived
    }
    if (externalId) {
        status.externalId = externalId;
    }
    return status;
}
