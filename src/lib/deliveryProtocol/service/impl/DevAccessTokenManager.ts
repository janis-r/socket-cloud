import {Inject} from "qft";
import {AccessTokenManager} from "../AccessTokenManager";
import {ConfigurationContextProvider} from "../../../configurationContext";
import {TokenInfo} from "../../data/TokenInfo";

export class DevAccessTokenManager implements AccessTokenManager {

    readonly validTestToken = "valid-x-api-key";


    @Inject()
    private readonly configurationContextProvider: ConfigurationContextProvider;

    readonly validateToken = async (token: string): Promise<null | TokenInfo> => {
        const {configurationContextProvider: {getConfigurationContext}} = this;
        if (!token || token !== this.validTestToken) {
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

