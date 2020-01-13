import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";

export type UnsubscribeMessage = {
    type: MessageType.Unsubscribe,
    channels: string[]
}
export const unsubscribeMessageUtil = new MessageValidator<UnsubscribeMessage>([
    {field: "type", exactValue: MessageType.Unsubscribe},
    {field: "channels", type: "string[]"}
]);
