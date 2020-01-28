import {PushToClientMessage} from "../serverMessage/PushToClientMessage";
import {MessageValidator} from "../../util/MessageValidator";

export type CachedMessage = Omit<PushToClientMessage, "type">;
export const cachedMessageUtil = new MessageValidator<CachedMessage>([
    {field: "time", type: "number"},
    {field: "messageId", type: "string"},
    {field: "channels", type: "string[]"},
    {field: "payload", type: "string"}
]);
