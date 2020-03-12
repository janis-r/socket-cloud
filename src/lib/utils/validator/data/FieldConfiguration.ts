import {SupportedType} from "./SupportedType";

/**
 * Object field validation configuration entry
 */
export type FieldConfiguration<T extends Record<string, any> = any> = {
    // Field name within object to validate
    field: keyof T,
    // Defines if it's fine for this field to be missing (default = false)
    optional?: true,
    // Check entry for exact value
    exactValue?: any,
    // Type of data or list of types
    type?: SupportedType | SupportedType[],

    // Value validator function
    validator?: (value: any, field?: keyof T) => boolean,
    // Defines that empty values, such as empty strings, should not be accepted as valid ones
    notEmpty?: boolean,
    // Array item validator that should be set only in conjunction with array data type
    itemValidator?: (value: any) => boolean
};
