import {MessageValidator} from "../../deliveryProtocol/util/MessageValidator";

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
export const ipcMessageUtil = new MessageValidator<IpcMessage>([
    {field: "id", type: "string", optional: true},
    {field: "scope", type: "string"},
    {field: "payload", type: "object"}
]);
