import {ConfigurationContext} from "../../configurationContext";

export type TokenInfo = {
    context: ConfigurationContext,
    // General access rights applied to all channels unless we have channel specific instructions
    accessRights?: "all" | {
        postIndividualMessages?: boolean,
        postChannelMessages?: boolean,
        postMultiChannelMessages?: boolean,
    },
    channelConfig?: {
        [channel: string]: TokenInfo["accessRights"]
    };
}
