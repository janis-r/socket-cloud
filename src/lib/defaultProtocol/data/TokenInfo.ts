import {ConfigurationContext} from "../../configurationContext";

export type TokenInfo = {
    context: ConfigurationContext,
    accessRights: "all" | {
        postIndividualMessages: boolean,
        postChannelMessages: boolean,
        postMultiChannelMessages: boolean,
    }
}
