import {MessageType} from "./MessageType";
import {FieldConfiguration, validateObject} from "../../../utils/validate-object";
import {isArrayOfStrings} from "../../../utils/is-array-of";

export type RestoreRequest = {
    type: MessageType.Restore,
    channels: RestoreTarget[]
}

const restoreRequestConfig: FieldConfiguration<RestoreRequest>[] = [
    {field: "type", exactValue: MessageType.Restore},
    {
        field: "channels",
        type: "array",
        validator: (value: RestoreRequest['channels']) => !value.some(subValue => !isRestoreTarget(subValue))
    }
];

export const isRestoreRequest = (value: unknown): value is RestoreRequest => validateObject(value, restoreRequestConfig) === true;

export function serializeRestoreRequest(value: RestoreRequest): string | null {
    if (!isRestoreRequest(value)) {
        return null;
    }
    const {type, channels} = value;
    return JSON.stringify([type, channels.map(value => serializeRestoreTarget(value))]);
}

export function deserializeRestoreRequest(value: string | Array<any>): RestoreRequest | null {
    let data;
    if (typeof value === "string") {
        try {
            data = JSON.parse(value);
        } catch (e) {
            console.log(`Error while deserialize RestoreRequest`, {value, e})
            return null;
        }
    } else {
        data = value;
    }

    if (!Array.isArray(data) || data.length !== 2) {
        return null;
    }

    const [type, channels] = data;
    if (!Array.isArray(channels)) {
        return null;
    }

    const parsed = {type, channels: channels.map(value => deserializeRestoreTarget(value))};
    if (isRestoreRequest(parsed)) {
        return parsed;
    }

    return null;
}

//-------------------------------------
// RestoreTarget definition goes here.
// Content wise it should be a separate file while semantically it's part of RestoreRequest and
// thus will stay isolated from rest of app in here
//-------------------------------------


type RestoreTarget = {
    channel: string,
    mid?: string
}
const restoreTargetConfig: FieldConfiguration<RestoreTarget>[] = [
    {field: "channel", type: "string"},
    {field: "mid", optional: true, type: "string"},
];

const isRestoreTarget = (value: RestoreTarget): value is RestoreTarget => validateObject(value, restoreTargetConfig) === true;
const serializeRestoreTarget = (value: RestoreTarget): string | null => {
    if (!isRestoreTarget(value)) {
        return null;
    }
    const {channel, mid} = value;
    if (mid) {
        return JSON.stringify([channel, mid]);
    }
    return JSON.stringify(channel);
};
const deserializeRestoreTarget = (value: string): RestoreTarget | null => {
    try {
        const data = JSON.parse(value);
        if (typeof data === "string") {
            return {channel: data};
        }
        if (Array.isArray(data) && data.length === 2 && isArrayOfStrings(data)) {
            const [name, lastKnownMessageId] = data;
            return {channel: name, mid: lastKnownMessageId};
        }
    } catch (e) {
        console.log(`Error while deserialize RestoreTarget`, {value, e})
    }
    return null;
};
