import { Inject } from "quiver-framework";
import { TokenInfo } from "../data/TokenInfo";
import { AccessTokenDataModel } from "../model/AccessTokenDataModel";
import { ConfigurationContextProvider } from "../../configurationContext/service/ConfigurationContextProvider";

export class AccessTokenProvider {

    @Inject()
    private readonly tokenDataModel: AccessTokenDataModel;
    @Inject()
    private readonly contextProvider: ConfigurationContextProvider;

    /**
     * Request access token info by string id
     * @param token String id of a token
     * @returns Token info if token is found and valid in all ways, null otherwise
     */
    readonly validateToken = async (token: string): Promise<TokenInfo | null> => {
        const {
            tokenDataModel: { getTokenData },
            contextProvider: { getConfigurationContext }
        } = this;

        const tokenData = await getTokenData(token);
        if (!tokenData) {
            return null;
        }

        const context = await getConfigurationContext(tokenData.contextId);
        if (!context) {
            return null;
        }

        const { token: tid, contextId, ...tokenExport } = tokenData;
        return { ...tokenExport, context };
    };
}