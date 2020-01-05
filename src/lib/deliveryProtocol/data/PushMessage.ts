import {MessageType} from "./MessageType";
import {FieldConfiguration, validateObject} from "../../utils/validate-object";

export type PushMessage = {
    type: MessageType.Push,
    destination: string | string[],
    payload: string
}
const pushMessageConfig: FieldConfiguration<PushMessage>[] = [
    {name: "type", exactValue: MessageType.Push},
    {name: "destination", type: ["string", "string[]"]},
    {name: "payload", type: "string"}
];

export const isPushMessage = (value: unknown): value is PushMessage => validateObject(value, pushMessageConfig) === true;

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
