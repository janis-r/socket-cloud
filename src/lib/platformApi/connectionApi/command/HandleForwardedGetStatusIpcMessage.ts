import { Command, Inject } from "quiver-framework";
import { IpcMessageEvent } from "../../../ipcMessenger/event/IpcMessageEvent";
import { IpcMessenger } from "../../../ipcMessenger/service/IpcMessenger";
import { GetConnectionStatusApiIpcMessage } from "../data/ipc/GetConnectionStatusApiIpcMessage";
import { ClientConnectionPool } from "../../../clientConnectionPool/model/ClientConnectionPool";
import { connectionToConnectionStatus } from "../util/connectionToConnectionStatus";
import { IpcMessage } from "../../../ipcMessenger/data/IpcMessage";

/**
 * Handle external request for client connection status forwarded to worker process from master.
 */
export class HandleForwardedGetStatusIpcMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent<GetConnectionStatusApiIpcMessage>;
    @Inject()
    private readonly messenger: IpcMessenger;
    @Inject()
    private readonly clientConnectionPool: ClientConnectionPool;

    execute(): Promise<void> | void {
        const { event: { message }, messenger: { send }, clientConnectionPool: { getConnectionById } } = this;
        const { payload, payload: { connectionId } } = message;

        const connection = getConnectionById(connectionId);
        if (!connection) {
            // Send back to master message as it were - there's no connection with this id known to this node
            send(message); //TODO Empty payload in this context would suffice
        } else {
            // Otherwise respond with connection status found within this node
            const response: IpcMessage<GetConnectionStatusApiIpcMessage> = {
                ...message,
                payload: { ...payload, status: connectionToConnectionStatus(connection) }
            };
            send(response);
        }
    }

}
