import {isArrayOfStrings} from "../is-array-of";
import {uniqueValues} from "ugd10a";
import {ObjectValidationError} from "./data/ObjectValidationError";
import {FieldConfiguration} from "./data/FieldConfiguration";

/**
 * Validate object against its configuration
 * @param value Object to validate
 * @param configuration List of object field configurations
 * @param allowExtraFields Whether to allow fields not listed in configuration
 * @return true in case validation was a success or ObjectValidationError instance explaining reasons of failure.
 */
export function validateObject(value: unknown, configuration: FieldConfiguration[], allowExtraFields = false): true | ObjectValidationError {
    // Check if object to validate type
    if (typeof value !== "object") {
        return {error: `Value is not an object: ${value}`};
    }

    const keys = Object.keys(value);
    for (const config of configuration) {
        const {field, optional, exactValue, type, validator, notEmpty} = config;
        const index = keys.indexOf(field.toString());
        if (index === -1) {
            if (optional) {
                continue;
            }
            return {field, error: "Field is missing"};
        }

        const entryValue = value[field];

        if ("exactValue" in config && entryValue !== exactValue) {
            return {field, error: `Exact value mismatch. Expected: ${exactValue}, actual: ${entryValue}`};
        }

        if (type) {
            if (isArrayOfStrings(type)) {
                const uniqueTypes = uniqueValues(type);
                if (!uniqueTypes.some(t => validateType(entryValue, {...config, type: t}) === true)) {
                    return {field, error: `Type mismatch. Value didn't match any of [${uniqueTypes}] types allowed`};
                }
            } else {
                const typeResult = validateType(entryValue, config);
                if (typeResult !== true) {
                    return {field, ...typeResult};
                }
            }
        }

        if (validator && !validator(entryValue, field)) {
            return {field, error: `Value ${entryValue} disallowed by validator`};
        }

        // Check if value is not empty - 0 is taken as defined value, everything else that turns into false in
        // boolean context is taken to be empty too
        if (notEmpty && entryValue !== 0 && entryValue !== false && !entryValue) {
            return {field, error: `Value ${entryValue} is empty`};
        }
        keys.splice(index, 1);
    }

    if (keys.length > 0 && !allowExtraFields) {
        return {error: `Extra, disallowed fields [${keys}] encountered`};
    }
    return true;
}

function validateType(value: unknown, config: FieldConfiguration): true | { error: string } {
    const {type, notEmpty, itemValidator} = config;
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




