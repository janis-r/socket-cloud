import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";

export type PushToClientMessage = {
    type: MessageType.PushToClient,
    time: number,
    messageId: string,
    payload: string,
    channels?: string[],
}

export const pushToClientUtil = new MessageValidator<PushToClientMessage>([
    {field: "type", exactValue: MessageType.PushToClient},
    {field: "time", type: "number"},
    {field: "messageId", type: "string"},
    {field: "payload", type: "string"},
    {field: "channels", type: "string[]", optional: true}
]);
