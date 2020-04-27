import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";
import {ChannelId, isChannelId} from "./../ChannelId";

export type PushToServerMessage = {
    type: MessageType.PushToServer,
    channels: ChannelId[],
    payload: string
}

export const pushToServerUtil = new MessageValidator<PushToServerMessage>([
    {field: "type", exactValue: MessageType.PushToServer},
    {field: "channels", type: "string[]", unique: true, itemValidator: isChannelId},
    {field: "payload", type: "string"}
]);
