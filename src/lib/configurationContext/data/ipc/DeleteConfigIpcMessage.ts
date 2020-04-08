import {Validator} from "ugd10a/validator";
import {ContextId} from "../ContextId";

export type DeleteConfigIpcMessage = {
    type: "delete",
    contextId: ContextId,
};

export const deleteConfigIpcMessageValidator = new Validator<DeleteConfigIpcMessage>({
    type: {exactValue: "delete"},
    contextId: {type: "string"}
});
