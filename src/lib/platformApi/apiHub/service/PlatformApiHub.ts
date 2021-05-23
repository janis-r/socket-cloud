import { Injectable } from "quiver-framework";
import { AccessTokenProvider } from "../../../authorization/service/AccessTokenProvider";
import { authTokenErrorResponseParams, authTokenHeaderName } from "../../../authorization/data/auth-credentials";
import { RequestContext } from "../../../httpServer/data/RequestContext";
import { HttpServerRouter } from "../../../httpServer/service/HttpServerRouter";
import { Router } from "../../../httpServer/data/Router";
import { PlatformApiCallManager } from "./PlatformApiCallManager";
import { PlatformApiRequestContext } from "../data/PlatformApiRequestContext";

@Injectable()
export abstract class PlatformApiHub {
    static readonly servicePath = "/api/platform";

    protected readonly servicePath = PlatformApiHub.servicePath;

    constructor(private readonly tokenManager: AccessTokenProvider,
        private readonly apiCallLogger: PlatformApiCallManager,
        private readonly router: HttpServerRouter
    ) {
        router.use(this.servicePath, this.registerApiCall, this.validateAccessToken);
    }

    registerSubRoutes(router: Router) {
        this.router.use(this.servicePath, router);
    }

    private readonly registerApiCall = async (request: RequestContext<Partial<PlatformApiRequestContext>>) => {
        const { apiCallLogger } = this;
        const { headers, ipAddress, path, body, setLocals, next } = request;

        const { id: apiCallId, logger } = await apiCallLogger.registerApiCall({ headers, ipAddress, path, body });

        setLocals({ apiCallId, logger });
        next();
    }

    private readonly validateAccessToken = async (request: RequestContext<PlatformApiRequestContext>) => {
        const { tokenManager: { validateToken } } = this;
        const { header, sendJson, locals: { apiCallId, logger }, setLocals, next } = request;

        const accessToken = header(authTokenHeaderName);
        if (!accessToken) {
            const error = "API key is not set";
            sendJson({ error }, authTokenErrorResponseParams);
            logger.log({ error }).commit();
            return;
        }

        const tokenInfo = await validateToken(accessToken);
        if (!tokenInfo) {
            const error = "API key, or its data context, is invalid";
            sendJson({ error }, authTokenErrorResponseParams);
            logger.log({ error }).commit();
            return;
        }

        setLocals({ apiCallId, logger, tokenInfo });
        next();
    }

}
