import {MessageType} from "./MessageType";
import {FieldConfiguration, validateObject} from "../../../utils/validate-object";
import {uniqueValues} from "ugd10a";

export type UnsubscribeMessage = {
    type: MessageType.Unsubscribe,
    channels: string[]
}
const messageConfig: FieldConfiguration<UnsubscribeMessage>[] = [
    {field: "type", exactValue: MessageType.Unsubscribe},
    {field: "channels", type: "string[]"}
];

export const isUnsubscribeMessage = (value: unknown): value is UnsubscribeMessage => validateObject(value, messageConfig) === true;

export function serializeUnsubscribeMessage(value: UnsubscribeMessage): string | null {
    if (!isUnsubscribeMessage(value)) {
        return null;
    }
    const {type, channels} = value;
    return JSON.stringify([type, channels]);
}

export function deserializeUnsubscribeMessage(value: string | Array<any>): UnsubscribeMessage | null {
    let data;
    if (typeof value === "string") {
        try {
            data = JSON.parse(value);
        } catch (e) {
            console.log(`Error while deserialize UnsubscribeMessage`, {value, e});
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
    if (isUnsubscribeMessage(parsed)) {
        const {type, channels} = parsed;
        return {type, channels: uniqueValues(channels)};
    }

    return null;
}
