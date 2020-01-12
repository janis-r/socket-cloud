import {FieldConfiguration, ObjectValidationError, validateObject} from "../../../utils/validate-object";

export type ChannelMessage = {
    channels: Array<string>,
    payload: string
};
export const individualMessageConfig: FieldConfiguration<ChannelMessage>[] = [
    {field: "channels", type: "string[]", notEmpty: true},
    {field: "payload", type: "string", notEmpty: true}
];

let lastValidationError: ObjectValidationError;
export const isChannelMessage = (value: unknown): value is ChannelMessage => {
    const validation = validateObject(
        value,
        individualMessageConfig
    );
    if (validation === true) {
        lastValidationError = null;
        return true;
    }

    lastValidationError = validation;
    return false;
};
export const getLastValidationError = () => !lastValidationError ? null : ({
    ...lastValidationError,
    field: lastValidationError.field.toString()
});
