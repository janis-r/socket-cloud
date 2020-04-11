import {EventDispatcher, Injectable} from "quiver-framework";
import {HttpRequestHandler, HttpServerRouter, HttpStatusCode} from "../../httpServer";
import {AccessTokenProvider} from "./AccessTokenProvider";
import {AccessTokenDataModel} from "../model/AccessTokenDataModel";
import {tokenDataValidator} from "../data/TokenData";
import {tokenMatchRegexp} from "../data/tokenMatchRegexp";
import {contextIdMatchRegexp} from "../../configurationContext/data/contextIdMatchRegexp";
import {AccessTokenApiConfig} from "../config/AccessTokenApiConfig";

@Injectable()
export class AccessTokenApiListener {
    readonly servicePath = "access-token";

    private readonly apiKeyHeaderName = "X-API-KEY";

    constructor(httpRouter: HttpServerRouter,
                private readonly config: AccessTokenApiConfig,
                private readonly tokenProvider: AccessTokenProvider,
                private readonly tokenDataModel: AccessTokenDataModel,
                private readonly eventDispatcher: EventDispatcher) {
        const {servicePath} = this;
        httpRouter.use(`/${servicePath}/`, this.validateRequestHeaders);
        httpRouter.post(`/${servicePath}`, this.createToken);
        httpRouter.get(`/${servicePath}/:token(${tokenMatchRegexp})`, this.getTokenInfo);
        httpRouter.delete(`/${servicePath}/:token(${tokenMatchRegexp})`, this.deleteToken);
        httpRouter.get(`/${servicePath}/context/:contextId(${contextIdMatchRegexp})`, this.getTokensInfoByContext);
    }

    private readonly createToken: HttpRequestHandler = async ({body, sendJson, sendStatus}) => {
        const {Ok, BadRequest} = HttpStatusCode;
        const {tokenDataModel: {saveTokenData}, eventDispatcher} = this;
        const tokenData = body;
        if (!tokenData) {
            sendStatus(BadRequest);
            return;
        }
        if (!tokenDataValidator.validate(tokenData)) {
            sendJson(tokenDataValidator.lastError, {status: 400});
            return;
        }

        if (await saveTokenData(tokenData)) {
            sendStatus(Ok);
        } else {
            sendStatus(BadRequest);
        }
    };

    private readonly validateRequestHeaders: HttpRequestHandler = async ({sendText, header, next}) => {
        const {apiKeyHeaderName, config: {apiKey}} = this;
        const requestKey = header(apiKeyHeaderName);

        const notAuthorizedParams = {
            status: 401,
            headers: {
                WWW_Authenticate: "Basic"
            }
        };

        if (!requestKey) {
            sendText("API key not set", notAuthorizedParams);
        } else if (requestKey !== apiKey) {
            // TODO: Log big fat error in here!
            sendText("Not authorized", notAuthorizedParams);
        } else {
            next();
        }
    };

    private readonly getTokenInfo: HttpRequestHandler = async ({param, sendJson, sendStatus}) => {
        const {NotFound} = HttpStatusCode;
        const {tokenDataModel: {getTokenData}} = this;

        const token = param("token").asString();
        const data = await getTokenData(token);
        if (data) {
            sendJson(data);
        } else {
            sendStatus(NotFound);
        }
    };

    private readonly getTokensInfoByContext: HttpRequestHandler = async ({param, sendJson}) => {
        const {tokenDataModel: {getTokensByContext}} = this;
        const contextId = param("contextId").asString();
        sendJson(await getTokensByContext(contextId));
    };

    private readonly deleteToken: HttpRequestHandler = async ({param, sendStatus}) => {
        const {Ok, NotFound} = HttpStatusCode;
        const {tokenDataModel: {deleteTokenData}, eventDispatcher} = this;
        const contextId = param("contextId").asString();

        if (await deleteTokenData(contextId)) {
            sendStatus(Ok);
        } else {
            sendStatus(NotFound);
        }
    };

}
