import {MessageType} from "./MessageType";
import {FieldConfiguration, validateObject} from "../../utils/validate-object";
import {uniqueValues} from "ugd10a";

export type PushMessage = {
    type: MessageType.Push,
    channels: string[],
    payload: string
}
const messageConfig: FieldConfiguration<PushMessage>[] = [
    {name: "type", exactValue: MessageType.Push},
    {name: "channels", type: "string[]"},
    {name: "payload", type: "string"}
];

export const isPushMessage = (value: unknown): value is PushMessage => validateObject(value, messageConfig) === true;

export function serializePushMessage(value: PushMessage): string | null {
    if (!isPushMessage(value)) {
        return null;
    }
    const {type, channels, payload} = value;
    return JSON.stringify([type, channels, payload]);
}

export function deserializePushMessage(value: string | Array<any>): PushMessage | null {
    let data;
    if (typeof value === "string") {
        try {
            data = JSON.parse(value);
        } catch (e) {
            console.log(`Error while deserialize PushMessage`, {value, e});
            return null;
        }
    } else {
        data = value;
    }

    if (!Array.isArray(data) || data.length !== 3) {
        return null;
    }
    const [type, destination, payload] = data;
    const parsed = {type, destination, payload};
    if (isPushMessage(parsed)) {
        const {type, channels, payload} = parsed;
        return {type, channels: uniqueValues(channels), payload};
    }

    return null;
}
