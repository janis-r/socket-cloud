import { ContextId } from "../../configurationContext/data/ContextId";
import { contextIdMatchRegexp } from "../../configurationContext/data/contextIdMatchRegexp";
import { tokenMatchRegexp } from "./tokenMatchRegexp";
import { AccessConfiguration, accessConfigurationValidator } from "./AccessConfiguration";

/**
 * Authorization token description - token itself and rights given to bearer of a token.
 */
export type TokenData = {
    // Token string id
    token: string,
    // Context id this token belongs to
    contextId: ContextId
} & AccessConfiguration;

const tokenRegexp = new RegExp(tokenMatchRegexp);
const contextIdRegexp = new RegExp(contextIdMatchRegexp);

export const tokenDataValidator = accessConfigurationValidator.extendFor<TokenData>({
    token: {
        type: "string",
        validator: (value: string) => value.length >= 10 && value.length <= 50 && tokenRegexp.exec(value) !== null
    },
    contextId: {
        type: "string",
        notEmpty: true,
        validator: value => !!contextIdRegexp.exec(value)
    }
});




