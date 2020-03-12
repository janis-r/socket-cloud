export type ObjectValidationError = {
    // Field name that originated an error
    field?: string | number | symbol,
    // Error string
    error: string
};

export const isObjectValidationError = (value: unknown): value is ObjectValidationError =>
    typeof value === "object" &&
    Object.keys(value).some(key => !["field", "error"].includes(key)) == false &&
    "error" in value &&
    typeof value["error"] === "string";
