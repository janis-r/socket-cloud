import {MessageType} from "../MessageType";
import {PushToClientMessage} from "./PushToClientMessage";
import {MessageValidator} from "../../util/MessageValidator";

export type RestoreChannelsResponseMessage = {
    type: MessageType.RestoreResponse,
    payload: Array<RestoredMessage>,
}

export type RestoredMessage = Omit<PushToClientMessage, "type">;
const restoreMessageUtil = new MessageValidator<RestoredMessage>([
    {field: "messageId", type: "string"},
    {field: "channels", type: "string[]"},
    {field: "payload", type: "string"}
]);

export const restoreResponseUtil = new MessageValidator<RestoreChannelsResponseMessage>([
    {field: "type", exactValue: MessageType.RestoreResponse},
    {
        field: "payload",
        type: "array",
        itemValidator: restoreMessageUtil.validate,
        itemSerializer: restoreMessageUtil.serialize,
        itemDeserializer: restoreMessageUtil.deserialize,
    }
]);


