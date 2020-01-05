import {isArrayOfStrings} from "./is-array-of";

export function validateObject(value: unknown, configuration: FieldConfiguration[], allowExtraFields = false): true | { name?: string | number | symbol, error: string } {
    if (typeof value !== "object") {
        return {error: `Value is not an object: ${value}`};
    }

    // console.log(arguments);
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
        if ('exactValue' in config && value[name] !== exactValue) {
            return {name, error: `Exact value mismatch. Expected: ${exactValue}, actual: ${value[name]}`};
        }
        if (type) {
            if (type === "array") {
                if (!Array.isArray(value[name])) {
                    return {name, error: `Type mismatch. Type is expected to be an array`};
                }
            } else if (type === "string[]") {
                if (!isArrayOfStrings(value[name])) {
                    return {name, error: `Type mismatch. Type is expected to be an array of strings`};
                }
            } else {
                const actualType = typeof value[name];
                if (type !== actualType) {
                    return {name, error: `Type mismatch. Expected: ${type}, actual: ${actualType}`};
                }
            }
        }
        if (validator && !validator(value[name], name)) {
            return {name, error: `Value ${value[name]} disallowed by validator`};
        }
        valueKeys.splice(index, 1);
    }

    if (valueKeys.length > 0 && !allowExtraFields) {
        return {error: `Extra, disallowed fields [${valueKeys}] encountered`};
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
