import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";
import {CacheFilter, cacheFilterUtil} from "../cache/CacheFilter";

export type RestoreChannelsRequestMessage = {
    type: MessageType.RestoreRequest,
    channels: RestoreTarget[]
}

type RestoreTarget = {
    channel: string,
    filter?: CacheFilter
}
const restoreTargetUtil = new MessageValidator<RestoreTarget>([
    {field: "channel", type: "string"},
    {field: "filter", optional: true, type: "object",
        itemValidator: value => cacheFilterUtil.validate(value),
        itemSerializer: value => cacheFilterUtil.serialize(value),
        itemDeserializer: value => cacheFilterUtil.deserialize(value),
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
