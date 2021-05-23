import { MessageType } from "../MessageType";
import { ChannelId } from "../ChannelId";
import { MessageValidator } from "../../util/MessageValidator";

export type SubscribeMessage = {
    type: MessageType.Subscribe,
    channels: ChannelId[]
}
export const subscribeMessageUtil = new MessageValidator<SubscribeMessage>([
    { field: "type", exactValue: MessageType.Subscribe },
    { field: "channels", type: "string[]", unique: true }
]);
