import {MessageType} from "./MessageType";
import {FieldConfiguration, validateObject} from "../../utils/validate-object";
import {isArrayOfStrings} from "../../utils/is-array-of";

export type RestoreRequest = {
    type: MessageType.Restore,
    target: RestoreTarget[]
}

const restoreRequestConfig: FieldConfiguration<RestoreRequest>[] = [
    {name: "type", exactValue: MessageType.Restore},
    {
        name: "target",
        type: "array",
        validator: (value: RestoreRequest['target']) => !value.some(subValue => !isRestoreTarget(subValue))
    }
];

export const isRestoreRequest = (value: unknown): value is RestoreRequest => validateObject(value, restoreRequestConfig) === true;

export function serializeRestoreRequest(value: RestoreRequest): string | null {
    if (!isRestoreRequest(value)) {
        return null;
    }
    const {type, target} = value;
    return JSON.stringify([type, target.map(value => serializeRestoreTarget(value))]);
}

export function deserializeRestoreRequest(value: string): RestoreRequest | null {
    try {
        const data = JSON.parse(value);
        if (!Array.isArray(data) || data.length !== 2) {
            return null;
        }

        const [type, target] = data;
        if (!Array.isArray(target)) {
            return null;
        }

        const parsed = {type, target: target.map(value => deserializeRestoreTarget(value))};
        if (isRestoreRequest(parsed)) {
            return parsed;
        }
    } catch (e) {
        console.log(`Error while deserializing PushMessage`, {value, e})
    }

    return null;
}

//-------------------------------------
// RestoreTarget definition goes here.
// Content wise it should be a separate file while semantically it's part of RestoreRequest and
// thus will stay isolated from rest of app in here
//-------------------------------------


type RestoreTarget = {
    name: string,
    lastKnownMessageId?: string
}
const restoreTargetConfig: FieldConfiguration<RestoreTarget>[] = [
    {name: "name", type: "string"},
    {name: "lastKnownMessageId", optional: true, type: "string"},
];

const isRestoreTarget = (value: RestoreTarget): value is RestoreTarget => validateObject(value, restoreTargetConfig) === true;
const serializeRestoreTarget = (value: RestoreTarget): string | null => {
    if (!isRestoreTarget(value)) {
        return null;
    }
    const {name, lastKnownMessageId} = value;
    if (lastKnownMessageId) {
        return JSON.stringify([name, lastKnownMessageId]);
    }
    return JSON.stringify(name);
};
const deserializeRestoreTarget = (value: string): RestoreTarget | null => {
    try {
        const data = JSON.parse(value);
        if (typeof data === "string") {
            return {name: data};
        }
        if (Array.isArray(data) && data.length === 2 && isArrayOfStrings(data)) {
            return {name: data[0], lastKnownMessageId: data[1]};
        }
    } catch (e) {
        console.log(`Error while deserialize RestoreTarget`, {value, e})
    }
    return null;
};
