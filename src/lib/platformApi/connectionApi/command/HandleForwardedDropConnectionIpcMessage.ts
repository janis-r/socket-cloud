import { Command, Inject } from "quiver-framework";
import { IpcMessageEvent } from "../../../ipcMessenger/event/IpcMessageEvent";
import { IpcMessenger } from "../../../ipcMessenger/service/IpcMessenger";
import { ClientConnectionPool } from "../../../clientConnectionPool/model/ClientConnectionPool";
import { DropConnectionApiIpcMessage } from "../data/ipc/DropConnectionApiIpcMessage";
import { CloseReason } from "../../../clientConnectionPool/data/CloseReason";
import { ConnectionState } from "../../../clientConnectionPool/data/ConnectionState";
import { IpcMessage } from "../../../ipcMessenger/data/IpcMessage";

/**
 * Handle forwarded drop connection IPC message
 */
export class HandleForwardedDropConnectionIpcMessage implements Command {

    @Inject()
    private readonly event: IpcMessageEvent<DropConnectionApiIpcMessage>;
    @Inject()
    private readonly messenger: IpcMessenger;
    @Inject()
    private readonly clientConnectionPool: ClientConnectionPool;

    execute(): Promise<void> | void {
        const { event: { message }, messenger: { send }, clientConnectionPool: { getConnectionById } } = this;
        const { payload, payload: { connectionId, reason } } = message;

        const connection = getConnectionById(connectionId);
        if (connection) {
            if ([ConnectionState.Connecting, ConnectionState.Open].includes(connection.state)) {
                connection.close(CloseReason.NormalClosure, reason);
            }
            // TODO: Might be good idea to send back something that indicate that connection was found
            // but it's state required no action
            const response: IpcMessage<DropConnectionApiIpcMessage> = {
                ...message,
                payload: { ...payload, success: true }
            }
            send(response);
        } else {
            // Send back to master message as it were - there's no connection with this id known to this node
            send(message); // TODO: Payload might be omitted in this context
        }
    }

}
