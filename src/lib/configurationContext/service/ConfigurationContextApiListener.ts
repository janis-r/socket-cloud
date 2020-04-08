import {EventDispatcher, Injectable} from "quiver-framework";
import {HttpRequestHandler, HttpServerRouter, HttpStatusCode} from "../../httpServer";
import {ConfigurationContextProvider, configurationContextValidator, contextIdMatchRegexp} from "..";
import {UpdateConfigurationContextEvent} from "../event/UpdateConfigurationContextEvent";
import {DeleteConfigurationContextEvent} from "../event/DeleteConfigurationContextEvent";

@Injectable()
export class ConfigurationContextApiListener {
    readonly servicePath = "context-config";

    constructor(httpRouter: HttpServerRouter,
                private readonly contextProvider: ConfigurationContextProvider,
                private readonly eventDispatcher: EventDispatcher) {
        const {servicePath} = this;

        httpRouter.get(`/${servicePath}/:contextId(${contextIdMatchRegexp})`, this.retrieveConfig);
        httpRouter.post(`/${servicePath}`, this.setConfig);
        httpRouter.delete(`/${servicePath}/:contextId(${contextIdMatchRegexp})`, this.deleteConfig);
    }

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
        const {eventDispatcher} = this;
        const configuration = body;
        if (!configuration) {
            sendStatus(BadRequest);
            return;
        }
        if (!configurationContextValidator.validate(configuration)) {
            sendJson(configurationContextValidator.lastError, {status: 400});
            return;
        }

        const event = new UpdateConfigurationContextEvent(configuration);
        eventDispatcher.dispatchEvent(event);
        if (await event.response) {
            sendStatus(Ok);
        } else {
            sendStatus(BadRequest);
        }
    };

    private readonly deleteConfig: HttpRequestHandler = async ({param, sendStatus}) => {
        const {Ok, NotFound} = HttpStatusCode;
        const {eventDispatcher} = this;
        const contextId = param("contextId").asString();

        const event = new DeleteConfigurationContextEvent(contextId);
        eventDispatcher.dispatchEvent(event);

        if (await event.response) {
            sendStatus(Ok);
        } else {
            sendStatus(NotFound);
        }
    };

}
