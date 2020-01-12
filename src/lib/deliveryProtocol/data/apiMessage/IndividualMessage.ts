import {FieldConfiguration, ObjectValidationError, validateObject} from "../../../utils/validate-object";
import {ExternalId} from "../../../clientConnectionPool";

export type IndividualMessage = {
    connectionIds: Array<ExternalId>,
    payload: string
};
export const individualMessageConfig: FieldConfiguration<IndividualMessage>[] = [
    {field: "connectionIds", type: "string[]", notEmpty: true},
    {field: "payload", type: "string", notEmpty: true}
];

let lastValidationError: ObjectValidationError;
export const isIndividualMessage = (value: unknown): value is IndividualMessage => {
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
