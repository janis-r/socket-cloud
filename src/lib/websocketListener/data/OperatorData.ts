import {FieldConfiguration, validateObject} from "../../utils/validator";

/**
 * Connection data provided by Operator upon connection authorization
 */
export type OperatorData = {
    externalId: string
};
export const isOperatorData = (value: unknown): value is OperatorData => validateObject(
    value,
    [
        {field: "externalId", type: "string", notEmpty: true}
    ] as FieldConfiguration<OperatorData>[]
) === true;
