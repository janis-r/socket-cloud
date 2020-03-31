import {Validator} from "../../utils/validator";

/**
 * Connection data provided by Operator upon connection authorization
 */
export type OperatorData = {
    externalId: string
};

const {validate} = new Validator<OperatorData>([{field: "externalId", type: "string", notEmpty: true}]);

export const isOperatorData = (value: unknown): value is OperatorData => validate(value);
