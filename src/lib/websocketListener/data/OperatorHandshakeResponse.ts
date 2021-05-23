import { Validator } from "ugd10a/validator";

/**
 * Connection data provided by Operator upon connection authorization
 */
export type OperatorHandshakeResponse = {
    externalId: string
};

const { validate } = new Validator<OperatorHandshakeResponse>({
    externalId: { type: "string", notEmpty: true }
});

export const isOperatorHandshakeResponse = (value: unknown): value is OperatorHandshakeResponse => validate(value);

