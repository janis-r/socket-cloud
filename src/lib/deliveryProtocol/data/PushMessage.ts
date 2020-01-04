import {MessageType} from "./MessageType";
import {isArrayOfStrings} from "../../utils/is-array-of";

export type PushMessage = {
    type: MessageType.Push,
    destination: string | string[],
    payload: string
}

export function serializePushMessage(value: PushMessage): string | null {
    if (!isPushMessage(value)) {
        return null;
    }
    const {type, destination, payload} = value;
    return JSON.stringify([type, destination, payload]);
}

export function deserializePushMessage(value: string): PushMessage | null {
    try {
        const data = JSON.parse(value);
        if (!Array.isArray(data) || data.length !== 3) {
            return null;
        }
        const [type, destination, payload] = data;
        const parsed = {type, destination, payload};
        if (isPushMessage(parsed)) {
            return parsed;
        }
    } catch (e) {
        console.log(`Error while deserialize PushMessage`, {value, e})
    }

    return null;
}

export function isPushMessage(value: Partial<PushMessage>): value is PushMessage {
    if (!value || typeof value !== "object" || Object.keys(value).length !== 3) {
        return false;
    }
    const {type, destination, payload} = value;
    if (type !== MessageType.Push) {
        return false;
    }
    if (typeof destination !== "string" && !isArrayOfStrings(destination)) {
        return false;
    }
    if (typeof payload !== "string") {
        return false;
    }
    return true;
}
