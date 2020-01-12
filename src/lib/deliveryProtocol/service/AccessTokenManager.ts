import {ConfigurationContextProvider} from "lib/configurationContext";
import {TokenInfo} from "../data/TokenInfo";

export class AccessTokenManager {

    private readonly configurationContextProvider: ConfigurationContextProvider;

    readonly validateToken = async (token: string): Promise<null | TokenInfo> => {
        const {configurationContextProvider: {getConfigurationContext}} = this;
        if (!token) {
            return null;
        }

        const contextId = "test";
        const accessRights: TokenInfo["accessRights"] = "all";

        const context = await getConfigurationContext(contextId);
        if (!context) {
            return null;
        }

        return {context, accessRights};
    }
}

