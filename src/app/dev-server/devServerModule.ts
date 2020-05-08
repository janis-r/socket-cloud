import * as cluster from "cluster";
import * as express from "express";
import url from "url";
import {InjectionConfig, ModuleConfig} from "quiver-framework";
import {Logger} from "../../lib/logger/service/Logger";
import {SwaggerApiConfig} from "../../lib/swaggerApiDisplay/config/SwaggerApiConfig";
import {SwaggerApiDisplayModule} from "../../lib/swaggerApiDisplay/SwaggerApiDisplayModule";
import {HttpServerRouter} from "../../lib/httpServer/service/HttpServerRouter";
import {HttpServerService} from "../../lib/httpServer/service/HttpServerService";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {authorizationModule} from "../../lib/authorization/authorizationModule";
import {PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension/PermessageDeflateExtensionModule";
import {defaultProtocolModule} from "../../lib/defaultProtocol/defaultProtocolModule";
import {websocketListenerModule} from "../../lib/websocketListener/WebsocketListenerModule";
import {PermessageDeflateConfig} from "../../lib/permessageDeflateExtension/config/PermessageDeflateConfig";
import {ConfigurationContextApiConfig} from "../../lib/configurationContext/config/ConfigurationContextApiConfig";
import {AccessTokenApiConfig} from "../../lib/authorization/config/AccessTokenApiConfig";
import {platformApiModule} from "../../lib/platformApi/platformApiModule";

export const configurationContextApiKey = "DEV::CONFIGURATION_CONTEXT_API_KEY";
export const accessTokenApiKey = "DEV::ACCESS_TOKEN_MANAGER_KEY";

export const devServerModule: ModuleConfig = {
    requires: [
        authorizationModule,
        SwaggerApiDisplayModule,
        PermessageDeflateExtensionModule,
        defaultProtocolModule,
        platformApiModule,
        websocketListenerModule
    ],
    mappings: [
        PermessageDeflateConfig,
        {
            map: SwaggerApiConfig,
            useValue: {
                basePath: "api",
                docs: [
                    {
                        name: "platform-api",
                        configFile: `${__dirname}/../../../api/platform-api.yaml`
                    },
                    {
                        name: "operator-api",
                        configFile: `${__dirname}/../../../api/operator-api.yaml`
                    },
                    {
                        name: "internal-api",
                        configFile: `${__dirname}/../../../api/internal-api.yaml`
                    }
                ]
            }
        } as InjectionConfig<SwaggerApiConfig>,
        {
            map: ConfigurationContextApiConfig,
            useValue: {apiKey: process?.env?.CONFIGURATION_CONTEXT_API_KEY || configurationContextApiKey}
        } as InjectionConfig<ConfigurationContextApiConfig>,
        {
            map: AccessTokenApiConfig,
            useValue: {apiKey: process?.env?.ACCESS_TOKEN_MANAGER_KEY || accessTokenApiKey}
        } as InjectionConfig<AccessTokenApiConfig>,
    ],
    setup: injector => {

        injector.get(Logger).context = cluster?.worker?.id.toString();

        const router = injector.get(HttpServerRouter);
        router.get('/', ({sendFile}) => sendFile(`${__dirname}/index.html`));
        router.put('/validationAPI/connection', ({body, sendJson}) => {
            const {query: {externalId}} = url.parse((body as SocketDescriptor).url, true);
            const response = {externalId: externalId ?? "externalId"};
            sendJson(response);
        });

        const {expressApp: app} = injector.get(HttpServerService);
        app.use("/script", express.static(__dirname + '/script'));
    }
};
