import {EventDispatcher, Injectable} from "quiver-framework";
import {HttpRequestHandler} from "../../httpServer/data/HttpRequestHandler";
import {HttpServerRouter} from "../../httpServer/service/HttpServerRouter";
import {HttpStatusCode} from "../../httpServer/data/HttpStatusCode";
import {ConfigurationContextModel} from "../model/ConfigurationContextModel";
import {ConfigurationContextProvider} from "./ConfigurationContextProvider";
import {contextIdMatchRegexp} from "../data/contextIdMatchRegexp";
import {configurationContextValidator} from "../data/ConfigurationContext"
import {UpdateConfigurationContextEvent} from "../event/UpdateConfigurationContextEvent";
import {DeleteConfigurationContextEvent} from "../event/DeleteConfigurationContextEvent";
import {ConfigurationContextApiConfig} from "../config/ConfigurationContextApiConfig";
import {defaultProtocolId} from "../../defaultProtocol/data/defaultProtocolId";

@Injectable()
export class ConfigurationContextApiListener {

    static readonly servicePath = "api/context-config";

    private readonly apiKeyHeaderName = "X-API-KEY";

    constructor(httpRouter: HttpServerRouter,
                private readonly contextProvider: ConfigurationContextProvider,
                private readonly contextModel: ConfigurationContextModel,
                private readonly config: ConfigurationContextApiConfig,
                private readonly eventDispatcher: EventDispatcher) {
        const {servicePath} = ConfigurationContextApiListener;
        httpRouter.use(`/${servicePath}/`, this.validateRequestHeaders);
        httpRouter.get(`/${servicePath}/:contextId(${contextIdMatchRegexp})`, this.retrieveConfig);
        httpRouter.post(`/${servicePath}`, this.setConfig);
        httpRouter.delete(`/${servicePath}/:contextId(${contextIdMatchRegexp})`, this.deleteConfig);
    }

    private readonly validateRequestHeaders: HttpRequestHandler = async ({sendText, header, next}) => {
        const {apiKeyHeaderName, config: {apiKey}} = this;
        const requestKey = header(apiKeyHeaderName);

        const notAuthorizedParams = {status: HttpStatusCode.Unauthorized, headers: {WWW_Authenticate: "Basic"}};
        if (!requestKey) {
            sendText("API key not set", notAuthorizedParams);
        } else if (requestKey !== apiKey) {
            // TODO: Log big fat error in here!
            sendText("Not authorized", notAuthorizedParams);
        } else {
            next();
        }
    };

    private readonly retrieveConfig: HttpRequestHandler = async ({param, sendJson, sendStatus}) => {
        const {NotFound} = HttpStatusCode;
        const {contextProvider: {getConfigurationContext}} = this;
        const contextId = param("contextId").asString();
        const contextConfig = await getConfigurationContext(contextId);
        if (!contextConfig) {
            sendStatus(NotFound);
        } else {
            sendJson(contextConfig);
        }
    };

    private readonly setConfig: HttpRequestHandler = async ({body, sendJson, sendStatus}) => {
        const {Ok, BadRequest} = HttpStatusCode;
        const {contextModel: {saveConfiguration}, eventDispatcher} = this;
        const configuration = body;

        if (!configuration || typeof configuration !== "object") {
            sendStatus(BadRequest);
            return;
        }

        if (!("protocol" in configuration)) {
            // Set protocol to default protocol once it's omitted
            configuration["protocol"] = defaultProtocolId;
        }

        if (!configurationContextValidator.validate(configuration)) {
            sendJson(configurationContextValidator.lastError, {status: 400});
            return;
        }

        if (await saveConfiguration(configuration)) {
            eventDispatcher.dispatchEvent(new UpdateConfigurationContextEvent(configuration.id));
            sendStatus(Ok);
        } else {
            sendStatus(BadRequest);
        }
    };

    private readonly deleteConfig: HttpRequestHandler = async ({param, sendStatus}) => {
        const {Ok, NotFound} = HttpStatusCode;
        const {contextModel: {deleteConfiguration}, eventDispatcher} = this;
        const contextId = param("contextId").asString();

        if (await deleteConfiguration(contextId)) {
            eventDispatcher.dispatchEvent(new DeleteConfigurationContextEvent(contextId));
            sendStatus(Ok);
        } else {
            sendStatus(NotFound);
        }
    };

}
