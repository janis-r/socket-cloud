import {isArrayOfStrings} from "./is-array-of";
import {uniqueValues} from "ugd10a";

export function validateObject(value: unknown, configuration: FieldConfiguration[], allowExtraFields = false): true | { name?: string | number | symbol, error: string } {
    if (typeof value !== "object") {
        return {error: `Value is not an object: ${value}`};
    }

    const valueKeys = Object.keys(value);
    for (const config of configuration) {
        const {name, optional, exactValue, type, validator} = config;
        const index = valueKeys.indexOf(name as string);
        if (index === -1) {
            if (optional) {
                continue;
            }
            return {name, error: `Field is missing`};
        }

        const entryValue = value[name];

        if ('exactValue' in config && entryValue !== exactValue) {
            return {name, error: `Exact value mismatch. Expected: ${exactValue}, actual: ${entryValue}`};
        }
        if (type) {
            if (isArrayOfStrings(type)) {
                const uniqueTypes = uniqueValues(type);
                if (!uniqueTypes.some(t => checkType(entryValue, t) === true)) {
                    return {name, error: `Type mismatch. Value didn't match any of [${uniqueTypes}] types allowed`};
                }
            } else {
                const typeResult = checkType(entryValue, type);
                if (typeResult !== true) {
                    return {name, ...typeResult};
                }
            }
        }
        if (validator && !validator(entryValue, name)) {
            return {name, error: `Value ${entryValue} disallowed by validator`};
        }
        valueKeys.splice(index, 1);
    }

    if (valueKeys.length > 0 && !allowExtraFields) {
        return {error: `Extra, disallowed fields [${valueKeys}] encountered`};
    }

    return true;
}

function checkType(value: unknown, type: SupportedType): true | { error: string } {
    if (type === "array") {
        if (!Array.isArray(value)) {
            return {error: `Type mismatch. Type is expected to be an array`};
        }
    } else if (type === "string[]") {
        if (!isArrayOfStrings(value)) {
            return {error: `Type mismatch. Type is expected to be an array of strings`};
        }
    } else {
        const actualType = typeof value;
        if (type !== actualType) {
            return {error: `Type mismatch. Expected: ${type}, actual: ${actualType}`};
        }
    }
    return true;
}

type SupportedType =
    "undefined"
    | "object"
    | "boolean"
    | "number"
    | "bigint"
    | "string"
    | "string[]"
    | "symbol"
    | "function"
    | "array";

export type FieldConfiguration<T extends Record<string, any> = any> = {
    name: keyof T,
    optional?: true,
    exactValue?: any,
    type?: SupportedType | SupportedType[],
    validator?: (value: any, field?: keyof T) => boolean
}
