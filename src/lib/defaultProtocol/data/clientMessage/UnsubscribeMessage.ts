import { MessageType } from "../MessageType";
import { MessageValidator } from "../../util/MessageValidator";
import { ChannelId, isChannelId } from "../ChannelId";

export type UnsubscribeMessage = {
    type: MessageType.Unsubscribe,
    channels: ChannelId[]
}
export const unsubscribeMessageUtil = new MessageValidator<UnsubscribeMessage>([
    { field: "type", exactValue: MessageType.Unsubscribe },
    { field: "channels", type: "string[]", itemValidator: isChannelId }
]);
