import {ConfigurationContext} from "../../configurationContext";
import {Validator} from "ugd10a/validator";

export type TokenInfo = {
    context: ConfigurationContext,
    // General access rights applied to all channels unless we have channel specific instructions
    accessRights?: AccessRights,
    channelConfig?: {
        [channel: string]: AccessRights
    };
}

type AccessRights = "all" | {
    postIndividualMessages?: boolean,
    postChannelMessages?: boolean,
    postMultiChannelMessages?: boolean,
};

const accessPermissionsValidator = new Validator<Exclude<AccessRights, string>>({
    postIndividualMessages: {type: "boolean", optional: true},
    postChannelMessages: {type: "boolean", optional: true},
    postMultiChannelMessages: {type: "boolean", optional: true},
});
const accessRightsValidator = value => value === "all" || accessPermissionsValidator.validate(value);

export const tokenValidator = new Validator<Omit<TokenInfo, "context">>({
    accessRights: {
        type: ["string", "object"],
        validator: accessRightsValidator
    },
    channelConfig:{
        type: "object",
        validator: value => Object.keys(value).some(entry => !accessRightsValidator(entry))
    }
});




