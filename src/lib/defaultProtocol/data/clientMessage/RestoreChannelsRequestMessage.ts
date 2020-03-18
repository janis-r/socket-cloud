import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";
import {CacheFilter, cacheFilterUtil} from "../cache/CacheFilter";

export type RestoreChannelsRequestMessage = {
    type: MessageType.RestoreRequest,
    channels: RestoreTarget[]
}

export type RestoreTarget = {
    channel: string,
    filter?: CacheFilter
}
const restoreTargetUtil = new MessageValidator<RestoreTarget>([
    {field: "channel", type: "string"},
    {field: "filter", optional: true, type: "object",
        validator: cacheFilterUtil.validate,
        itemSerializer: cacheFilterUtil.serialize,
        itemDeserializer: cacheFilterUtil.deserialize,
    },
]);

export const restoreRequestUtil = new MessageValidator<RestoreChannelsRequestMessage>([
    {field: "type", exactValue: MessageType.RestoreRequest},
    {
        field: "channels",
        type: "array",
        itemValidator: value => restoreTargetUtil.validate(value)
    }
]);
