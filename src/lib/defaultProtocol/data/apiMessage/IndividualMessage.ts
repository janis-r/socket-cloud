import {ExternalId} from "../../../clientConnectionPool/data/ExternalId";
import {MessageValidator} from "../../util/MessageValidator";

export type IndividualMessage = {
    connectionIds: Array<ExternalId>,
    payload: string
};
export const individualMessageUtil = new MessageValidator<IndividualMessage>([
    {field: "connectionIds", type: "string[]", notEmpty: true},
    {field: "payload", type: "string", notEmpty: true}
]);
