import { MessageType } from "../MessageType";
import { MessageValidator } from "../../util/MessageValidator";
import { ChannelId, isChannelId } from "../../data/ChannelId";

export type PushToClientMessage = {
    type: MessageType.PushToClient,
    time: number,
    messageId: string,
    payload: string,
    channels?: ChannelId[],
}

export const pushToClientUtil = new MessageValidator<PushToClientMessage>([
    { field: "type", exactValue: MessageType.PushToClient },
    { field: "time", type: "number" },
    { field: "messageId", type: "string" },
    { field: "payload", type: "string" },
    { field: "channels", type: "string[]", itemValidator: isChannelId }
]);
