import {ContextId, contextIdMatchRegexp} from "../../configurationContext";
import {Validator} from "ugd10a/validator";
import {AccessRights, accessRightsValidator} from "./AccessRights";
import {tokenMatchRegexp} from "./tokenMatchRegexp";

/**
 * Authorization token description - token itself and rights given to bearer of a token.
 */
export type TokenData = {
    // Token string id
    token: string,
    // Context id this token belongs to
    contextId: ContextId,
    // General access rights applied to all channels unless we have channel specific instructions
    accessRights?: AccessRights,
    // Per channel access rights
    channelConfig?: {
        [channel: string]: AccessRights
    };
}

const contextIdRegexp = new RegExp(contextIdMatchRegexp);

export const tokenDataValidator = new Validator<TokenData>({
    token: {
        type: "string",
        validator: (value: string) => value.length >= 10 && value.length <= 50 && new RegExp(tokenMatchRegexp).exec(value) !== null
    },
    contextId: {type: "string", notEmpty: true, validator: value => !!contextIdRegexp.exec(value)},
    accessRights: {
        type: ["string", "object"],
        optional: true,
        validator: accessRightsValidator
    },
    channelConfig: {
        type: "object",
        optional: true,
        validator: value => Object.keys(value).some(entry => !accessRightsValidator(entry))
    }
});




