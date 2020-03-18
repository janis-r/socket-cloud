import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";
import {CachedMessage, cachedMessageUtil} from "../cache/CachedMessage";

export type RestoreChannelsResponseMessage = {
    type: MessageType.RestoreResponse,
    payload: Array<CachedMessage>,
}

export const restoreResponseUtil = new MessageValidator<RestoreChannelsResponseMessage>([
    {field: "type", exactValue: MessageType.RestoreResponse},
    {
        field: "payload",
        type: "array",
        itemValidator: cachedMessageUtil.validate,
        itemSerializer: cachedMessageUtil.serialize,
        itemDeserializer: cachedMessageUtil.deserialize,
    }
]);


