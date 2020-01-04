import {MessageType} from "./MessageType";
import {validateObject} from "../../utils/validate-object";
import {isArrayOfStrings} from "../../utils/is-array-of";

export type RestoreRequest = {
    type: MessageType.Restore,
    target: RestoreTarget[],
}
export const isRestoreRequest = (value: Partial<RestoreRequest>): value is RestoreRequest => validateObject(value, [
    {name: "type", exactValue: MessageType.Restore},
    {
        name: "target",
        type: "object",
        validator: (value: RestoreRequest['target']) => !value.some(subValue => !RestoreTargetUtils.validate(subValue))
    }
]) === true;

export function serializeRestoreRequest(value: RestoreRequest): string | null {
    if (!isRestoreRequest(value)) {
        return null;
    }
    const {serialize: serializeRestoreTarget} = RestoreTargetUtils;
    const {type, target} = value;
    return JSON.stringify([type, target.map(value => serializeRestoreTarget(value))]);
}

export function deserializeRestoreRequest(value: string): RestoreRequest | null {
    const {deserialize: deserializeRestoreTarget} = RestoreTargetUtils;
    try {
        const data = JSON.parse(value);
        if (!Array.isArray(data) || data.length !== 2) {
            return null;
        }
        console.log({data});

        const [type, target] = data;
        if (!Array.isArray(target)) {
            return null;
        }

        const parsed = {type, target: target.map(value => deserializeRestoreTarget(value))};
        console.log({parsed})

        if (isRestoreRequest(parsed)) {
            return parsed;
        }
    } catch (e) {
        console.log(`Error while deserializing PushMessage`, {value, e})
    }

    return null;
}

// ----------------------------------------------
type RestoreTarget = {
    name: string,
    lastKnownMessageId?: string
}

class RestoreTargetUtils {

    static readonly validate = (value: unknown): value is RestoreTarget =>
        validateObject(value, [
            {name: "name", type: "string"},
            {name: "lastKnownMessageId", optional: true, type: "string"},
        ]) === true;

    static readonly serialize = (value: RestoreTarget): string | null => {
        if (!RestoreTargetUtils.validate(value)) {
            return null;
        }
        const {name, lastKnownMessageId} = value;
        if (lastKnownMessageId) {
            return JSON.stringify([name, lastKnownMessageId]);
        }
        return JSON.stringify(name);
    };

    static readonly deserialize = (value: string): RestoreTarget | null => {
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
    }
}
