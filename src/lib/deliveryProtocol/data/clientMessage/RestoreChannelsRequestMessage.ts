import {MessageType} from "../MessageType";
import {MessageValidator} from "../../util/MessageValidator";

export type RestoreChannelsRequestMessage = {
    type: MessageType.RestoreRequest,
    channels: RestoreTarget[]
}

type RestoreTarget = {
    channel: string,
    messageId?: string
}
const restoreTargetUtil = new MessageValidator<RestoreTarget>([
    {field: "channel", type: "string"},
    {field: "messageId", optional: true, type: "string"},
]);

export const restoreRequestUtil = new MessageValidator<RestoreChannelsRequestMessage>([
    {field: "type", exactValue: MessageType.RestoreRequest},
    {
        field: "channels",
        type: "array",
        itemValidator: value => restoreTargetUtil.validate(value)
    }
]);
