import {Inject} from "qft";
import {ConfigurationContextProvider} from "../../configurationContext";
import {TokenInfo} from "../data/TokenInfo";

export class AccessTokenManager {

    @Inject()
    private readonly configurationContextProvider: ConfigurationContextProvider;

    readonly validateToken = async (token: string): Promise<null | TokenInfo> => {
        const {configurationContextProvider: {getConfigurationContext}} = this;
        if (!token) {
            return null;
        }

        const contextId = "tests-runner";
        const accessRights: TokenInfo["accessRights"] = "all";

        const context = await getConfigurationContext(contextId);
        if (!context) {
            return null;
        }

        return {context, accessRights};
    }
}

