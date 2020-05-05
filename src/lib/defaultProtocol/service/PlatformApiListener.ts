import {Inject} from "quiver-framework";
import {AccessTokenProvider} from "../../authorization/service/AccessTokenProvider";
import {TokenInfo} from "../../authorization/data/TokenInfo";
import {RequestContext} from "../../httpServer/data/RequestContext";
import {PlatformApiCallManager} from "./PlatformApiCallManager";
import {ScopedLogger} from "../util/ScopedLogger";
import {authTokenErrorResponseParams, authTokenHeaderName} from "../../authorization/data/auth-credentials";

export abstract class PlatformApiListener {
    static readonly servicePath = "api/platform";

    protected readonly servicePath = PlatformApiListener.servicePath;

    @Inject()
    private readonly tokenManager: AccessTokenProvider;
    @Inject()
    private readonly apiCallLogger: PlatformApiCallManager;

    protected async getApiCallContext(request: RequestContext): Promise<{ apiCallId: number, tokenInfo: TokenInfo, logger: ScopedLogger } | null> {
        const {tokenManager: {validateToken}, apiCallLogger} = this;
        const {header, sendJson, headers, ipAddress, path, body} = request;

        const {id: apiCallId, logger} = await apiCallLogger.registerApiCall({headers, ipAddress, path, body});

        const accessToken = header(authTokenHeaderName);
        if (!accessToken) {
            const error = "API key is not set";
            sendJson({error}, authTokenErrorResponseParams);
            logger.log({error}).commit();
            return null;
        }

        const tokenInfo = await validateToken(accessToken);
        if (!tokenInfo) {
            const error = "API key, or its data context, is invalid";
            sendJson({error}, authTokenErrorResponseParams);
            logger.log({error}).commit();
            return null;
        }

        // TODO: It would be reasonable to remove context from request URL, probably
        const contextInPath = request.param("context").asString();
        if (contextInPath !== tokenInfo.context.id) {
            const error = "Context id mismanaged";
            sendJson({error}, authTokenErrorResponseParams);
            logger.log({error}).commit();
            return null;
        }

        return {apiCallId, tokenInfo, logger};
    }
}
