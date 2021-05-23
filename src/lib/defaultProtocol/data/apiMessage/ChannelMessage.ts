import { MessageValidator } from "../../util/MessageValidator";

export type ChannelMessage = {
    channels: Array<string>,
    payload: string
};
export const channelMessageUtil = new MessageValidator<ChannelMessage>([
    { field: "channels", type: "string[]", notEmpty: true, unique: true },
    { field: "payload", type: "string", notEmpty: true }
]);
