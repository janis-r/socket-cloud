import {MessageType} from "./MessageType";
import {FieldConfiguration, validateObject} from "../../../utils/validate-object";
import {uniqueValues} from "ugd10a";
import {ChannelId} from "../ChannelId";

export type SubscribeMessage = {
    type: MessageType.Subscribe,
    channels: ChannelId[]
}
const messageConfig: FieldConfiguration<SubscribeMessage>[] = [
    {field: "type", exactValue: MessageType.Subscribe},
    {field: "channels", type: "string[]"}
];

export const isSubscribeMessage = (value: unknown): value is SubscribeMessage => validateObject(value, messageConfig) === true;

export function serializeSubscribeMessage(value: SubscribeMessage): string | null {
    if (!isSubscribeMessage(value)) {
        return null;
    }
    const {type, channels} = value;
    return JSON.stringify([type, channels]);
}

export function deserializeSubscribeMessage(value: string | Array<any>): SubscribeMessage | null {
    let data;
    if (typeof value === "string") {
        try {
            data = JSON.parse(value);
        } catch (e) {
            console.log(`Error while deserialize SubscribeMessage`, {value, e});
            return null;
        }
    } else {
        data = value;
    }

    if (!Array.isArray(data) || data.length !== 2) {
        return null;
    }
    const [type, destination] = data;
    const parsed = {type, destination};
    if (isSubscribeMessage(parsed)) {
        const {type, channels} = parsed;
        return {type, channels: uniqueValues(channels)};
    }

    return null;
}
