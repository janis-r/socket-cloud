import {Injectable} from "quiver-framework";
import {HttpRequestHandler, HttpServerRouter, HttpStatusCode} from "../../httpServer";
import {AccessTokenProvider} from "./AccessTokenProvider";
import {AccessTokenDataModel} from "../model/AccessTokenDataModel";
import {tokenMatchRegexp} from "../data/tokenMatchRegexp";
import {contextIdMatchRegexp} from "../../configurationContext/data/contextIdMatchRegexp";
import {AccessTokenApiConfig} from "../config/AccessTokenApiConfig";
import {accessConfigurationValidator} from "../data/AccessConfiguration";
import {ConfigurationContextProvider} from "../../configurationContext";

@Injectable()
export class AccessTokenApiListener {
    readonly servicePath = "access-token";

    private readonly apiKeyHeaderName = "X-API-KEY";

    constructor(httpRouter: HttpServerRouter,
                private readonly config: AccessTokenApiConfig,
                private readonly tokenProvider: AccessTokenProvider,
                private readonly tokenDataModel: AccessTokenDataModel,
                private readonly contextProvider: ConfigurationContextProvider) {
        const {servicePath: path} = this;

        const contextIdParam = `:contextId(${contextIdMatchRegexp})`;
        const tokenParam = `:token(${tokenMatchRegexp})`;

        httpRouter.use(`/${path}/`, this.validateRequestHeaders);

        httpRouter.post(`/${path}/${contextIdParam}`, this.createAccessConfiguration);
        httpRouter.get(`/${path}/${contextIdParam}`, this.getTokensInfoByContext);
        httpRouter.get(`/${path}/${contextIdParam}/${tokenParam}`, this.getTokenInfo);
        httpRouter.delete(`/${path}/${contextIdParam}/${tokenParam}`, this.deleteToken);

    }

    private readonly validateRequestHeaders: HttpRequestHandler = async ({sendText, header, next}) => {
        const {apiKeyHeaderName, config: {apiKey}} = this;
        const requestKey = header(apiKeyHeaderName);

        const notAuthorizedParams = {status: 401, headers: {WWW_Authenticate: "Basic"}};
        if (!requestKey) {
            sendText("API key not set", notAuthorizedParams);
        } else if (requestKey !== apiKey) {
            // TODO: Log big fat error in here!
            sendText("Not authorized", notAuthorizedParams);
        } else {
            next();
        }
    };

    private readonly createAccessConfiguration: HttpRequestHandler = async ({param, body, sendJson, sendStatus}) => {
        const {Ok, BadRequest} = HttpStatusCode;
        const {contextProvider: {getConfigurationContext}, tokenDataModel: {createAccessEntry}} = this;

        const contextId = param("contextId").asString();
        if (await getConfigurationContext(contextId) === null) {
            sendStatus(BadRequest);
            return;
        }

        const accessConfiguration = body;
        if (!accessConfiguration) {
            sendStatus(BadRequest);
            return;
        }

        if (!accessConfigurationValidator.validate(accessConfiguration)) {
            sendJson(accessConfigurationValidator.lastError, {status: 400});
            return;
        }

        const token = await createAccessEntry(contextId, accessConfiguration);
        if (token) {
            sendJson({token});
        } else {
            sendStatus(BadRequest);
        }
    };

    private readonly getTokensInfoByContext: HttpRequestHandler = async ({param, sendJson}) => {
        const {tokenDataModel: {getTokensByContext}} = this;
        const contextId = param("contextId").asString();
        sendJson(await getTokensByContext(contextId));
    };


    private readonly getTokenInfo: HttpRequestHandler = async ({param, sendJson, sendStatus}) => {
        const {NotFound} = HttpStatusCode;
        const {tokenDataModel: {getTokenData}} = this;

        const contextId = param("contextId").asString();
        const token = param("token").asString();

        const data = await getTokenData(token);
        if (!data) {
            sendStatus(NotFound);
        } else if(data.contextId !== contextId) { // Context id mismatch
            // TODO: Log big fat notice in here
            sendStatus(NotFound);
        } else {
            sendJson(data);
        }
    };

    private readonly deleteToken: HttpRequestHandler = async ({param, sendStatus}) => {
        const {Ok, NotFound} = HttpStatusCode;
        const {tokenDataModel: {getTokenData, deleteTokenData}} = this;

        const contextId = param("contextId").asString();
        const token = param("token").asString();

        const data = await getTokenData(token);
        if (!data) {
            sendStatus(NotFound);
        } else if(data.contextId !== contextId) { // Context id mismatch
            // TODO: Log big fat notice in here
            sendStatus(NotFound);
        } else {
            await deleteTokenData(token);
            sendStatus(Ok);
        }
    };

}
