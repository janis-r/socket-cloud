import {ConnectionId} from "../../../../clientConnectionPool/data/ConnectionId";
import {ConnectionApiIpcMessageType} from "./ConnectionApiIpcMessageType";
import {Validator} from "ugd10a/validator";

export type DropConnectionApiIpcMessage = {
    type: ConnectionApiIpcMessageType.DropConnection,
    connectionId: ConnectionId,
    reason?: string,
    success?: boolean
}

export const dropConnectionApiIpcMessageValidator = new Validator<DropConnectionApiIpcMessage>({
    type: {exactValue: ConnectionApiIpcMessageType.DropConnection},
    connectionId: {type: "string", notEmpty: true},
    reason: {type: "string", optional: true},
    success: {type: "boolean", optional: true},
});


