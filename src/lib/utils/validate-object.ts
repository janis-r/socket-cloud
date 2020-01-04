export function validateObject(value: Record<any, any>, configuration: FieldConfiguration[], allowExtraFields = false): true | { name?: string, error: string } {
    console.log(arguments)
    const valueKeys = Object.keys(value);
    for (const config of configuration) {
        const {name, optional, exactValue, type, validator} = config;
        const index = valueKeys.indexOf(name);
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
            const actualType = typeof value[name];
            if (type !== actualType) {
                return {name, error: `Type mismatch. Expected: ${type}, actual: ${actualType}`};
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

type FieldConfiguration = {
    name: string,
    optional?: true,
    exactValue?: any,
    type?: "undefined" | "object" | "boolean" | "number" | "bigint" | "string" | "symbol" | "function",
    validator?: (value: any, field?: string) => boolean
}
