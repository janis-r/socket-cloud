import {Validator} from "ugd10a/validator";
import {ConnectionId} from "../../../../clientConnectionPool/data/ConnectionId";
import {ConnectionApiIpcMessageType} from "./ConnectionApiIpcMessageType";
import {ConnectionStatus} from "../ConnectionStatus";

export type GetConnectionStatusApiIpcMessage = {
    type: ConnectionApiIpcMessageType.GetStatus,
    connectionId: ConnectionId,
    status?: ConnectionStatus
}

export const getStatusConnectionApiIpcMessageValidator = new Validator<GetConnectionStatusApiIpcMessage>({
    type: {exactValue: ConnectionApiIpcMessageType.GetStatus},
    connectionId: {type: "string", notEmpty: true}
});
