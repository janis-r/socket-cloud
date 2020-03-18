import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";

export type PushToServerMessage = {
    type: MessageType.PushToServer,
    channels: string[],
    payload: string
}

export const pushToServerUtil = new MessageValidator<PushToServerMessage>([
    {field: "type", exactValue: MessageType.PushToServer},
    {field: "channels", type: "string[]", unique: true},
    {field: "payload", type: "string"}
]);
