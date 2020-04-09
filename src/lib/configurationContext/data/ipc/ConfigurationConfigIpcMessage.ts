import {Validator} from "ugd10a/validator";
import {ContextId} from "../ContextId";
import {valueBelongsToEnum} from "ugd10a";

export type ConfigurationConfigIpcMessage = {
    type: ConfigurationConfigIpcMessageType,
    contextId: ContextId,
};

export enum ConfigurationConfigIpcMessageType {
    Delete,
    Update
}

export const configurationConfigIpcMessageValidator = new Validator<ConfigurationConfigIpcMessage>({
    type: {validator: value => valueBelongsToEnum(ConfigurationConfigIpcMessageType, value)},
    contextId: {type: "string"}
});
