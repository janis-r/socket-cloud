import { Validator } from "ugd10a/validator";
import { AccessRightsConstant, accessRightsConstantValidator } from "./AccessRightsConstant";

export type AccessRights = AccessRightsConstant | {
    messages?: {
        postToIndividual?: boolean,
        postToChannel?: boolean,
        postMultiChannel?: boolean,
        requestChannelCacheStats?: boolean,
        clearChannelCache?: boolean,
    },
    connection?: {
        retrieveStatus?: boolean,
        drop?: boolean
    }
};

type AccessRightsList = Exclude<AccessRights, AccessRightsConstant>;
const accessPermissionsValidator = new Validator<AccessRightsList>({
    messages: {
        type: "object",
        optional: true,
        validator: new Validator<AccessRightsList["messages"]>({
            postToIndividual: { type: "boolean", optional: true },
            postToChannel: { type: "boolean", optional: true },
            postMultiChannel: { type: "boolean", optional: true },
            requestChannelCacheStats: { type: "boolean", optional: true },
            clearChannelCache: { type: "boolean", optional: true },
        })
    },
    connection: {
        type: "object",
        optional: true,
        validator: new Validator<AccessRightsList["connection"]>({
            retrieveStatus: { type: "boolean", optional: true },
            drop: { type: "boolean", optional: true }
        })
    }
});
export const accessRightsValidator = value => accessRightsConstantValidator(value) || accessPermissionsValidator.validate(value);
