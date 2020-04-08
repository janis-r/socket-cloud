import {Validator} from "ugd10a/validator";
import {ConfigurationContext, configurationContextValidator} from "../ConfigurationContext";

export type UpdateConfigIpcMessage = {
    type: "update",
    context: ConfigurationContext,
};

export const updateConfigIpcMessageValidator = new Validator<UpdateConfigIpcMessage>({
    type: {exactValue: "update"},
    context: {validator: configurationContextValidator.validate}
});
