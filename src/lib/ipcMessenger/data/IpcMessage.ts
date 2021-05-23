import { MessageValidator } from "../../defaultProtocol/util/MessageValidator";

/**
 * Message data format which is delivered between processes
 */
export type IpcMessage<P = any> = {
    // unique id of message
    id: string,
    // scope of message used to delimit functional scopes so messages of different origin can be split at early stages
    scope: string,
    // payload!
    payload: P
}

export type IpcMessageId = IpcMessage["id"];

export const ipcMessageUtil = new MessageValidator<IpcMessage>([
    { field: "id", type: "string", notEmpty: true },
    { field: "scope", type: "string", notEmpty: true },
    { field: "payload", type: "object" }
]);

