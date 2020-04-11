import {Validator} from "ugd10a/validator";
import {AccessRightsConstant, accessRightsConstantValidator} from "./AccessRightsConstant";

export type AccessRights = AccessRightsConstant | {
    postIndividualMessages?: boolean,
    postChannelMessages?: boolean,
    postMultiChannelMessages?: boolean,
};

const accessPermissionsValidator = new Validator<Exclude<AccessRights, AccessRightsConstant>>({
    postIndividualMessages: {type: "boolean", optional: true},
    postChannelMessages: {type: "boolean", optional: true},
    postMultiChannelMessages: {type: "boolean", optional: true},
});
export const accessRightsValidator = value => accessRightsConstantValidator(value) || accessPermissionsValidator.validate(value);
