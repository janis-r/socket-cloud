import {isArrayOfStrings} from "./is-array-of";
import {uniqueValues} from "ugd10a";

export function validateObject(value: unknown, configuration: FieldConfiguration[], allowExtraFields = false): true | ObjectValidationError {
    if (typeof value !== "object") {
        return {error: `Value is not an object: ${value}`};
    }

    const valueKeys = Object.keys(value);
    for (const config of configuration) {
        const {field: f, optional, exactValue, type, validator, notEmpty, itemValidator} = config;
        const field = f as string;

        const index = valueKeys.indexOf(field as string);
        if (index === -1) {
            if (optional) {
                continue;
            }
            return {field, error: `Field is missing`};
        }

        const entryValue = value[field];

        if ('exactValue' in config && entryValue !== exactValue) {
            return {field, error: `Exact value mismatch. Expected: ${exactValue}, actual: ${entryValue}`};
        }
        if (type) {
            if (isArrayOfStrings(type)) {
                const uniqueTypes = uniqueValues(type);
                if (!uniqueTypes.some(t => checkType(entryValue, t, notEmpty, itemValidator) === true)) {
                    return {field, error: `Type mismatch. Value didn't match any of [${uniqueTypes}] types allowed`};
                }
            } else {
                const typeResult = checkType(entryValue, type, notEmpty, itemValidator);
                if (typeResult !== true) {
                    return {field, ...typeResult};
                }
            }
        }
        if (validator && !validator(entryValue, field)) {
            return {field, error: `Value ${entryValue} disallowed by validator`};
        }
        valueKeys.splice(index, 1);
    }

    if (valueKeys.length > 0 && !allowExtraFields) {
        return {error: `Extra, disallowed fields [${valueKeys}] encountered`};
    }

    return true;
}

function checkType(value: unknown, type: SupportedType, notEmpty: boolean, itemValidator: FieldConfiguration['itemValidator']): true | { error: string } {
    if (type === "array") {
        if (!Array.isArray(value)) {
            return {error: `Type mismatch. Type is expected to be an array`};
        }
        if (notEmpty && !value.length) {
            return {error: `Array is empty.`};
        }
        if (itemValidator) {
            if (value.some(entry => !itemValidator(entry))) {
                return {error: `Array item type mismatch.`};
            }
        }
    } else if (type === "string[]") {
        if (!isArrayOfStrings(value)) {
            return {error: `Type mismatch. Type is expected to be an array of strings`};
        }
        if (notEmpty && !value.length) {
            return {error: `Array length mismatch - is empty.`};
        }
        if (itemValidator) {
            if (value.some(entry => !itemValidator(entry))) {
                return {error: `Array item type mismatch.`};
            }
        }
    } else {
        const actualType = typeof value;
        if (type !== actualType) {
            return {error: `Type mismatch. Expected: ${type}, actual: ${actualType}`};
        }
        if (notEmpty && typeof value === "string" && !value.length) {
            return {error: `String length mismatch - is empty.`};
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
    field: keyof T,
    optional?: true,
    exactValue?: any,
    type?: SupportedType | SupportedType[],
    validator?: (value: any, field?: keyof T) => boolean,
    notEmpty?: boolean,
    itemValidator?: (value: any) => boolean
}

export type ObjectValidationError = { field?: string, error: string };
