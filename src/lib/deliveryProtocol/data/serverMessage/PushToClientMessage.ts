import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";

export type PushToClientMessage = {
    type: MessageType.PushToClient,
    messageId: string,
    channels: string[],
    payload: string,
}

export const pushToClientUtil = new MessageValidator<PushToClientMessage>([
    {field: "type", exactValue: MessageType.PushToClient},
    {field: "messageId", type: "string"},
    {field: "channels", type: "string[]"},
    {field: "payload", type: "string"}
]);
