import {Validator} from "ugd10a/validator";
import {AccessRights, accessRightsValidator} from "./AccessRights";

export type AccessConfiguration = {
    accessRights?: AccessRights,
    // Per channel access rights
    channelConfig?: {
        [channel: string]: AccessRights
    };
}

export const accessConfigurationValidator = new Validator<AccessConfiguration>({
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




