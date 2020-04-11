import * as cluster from "cluster";
import * as express from "express";
import url from "url";
import {InjectionConfig, ModuleConfig} from "quiver-framework";
import {Logger} from "../../lib/logger";
import {SwaggerApiConfig, SwaggerApiDisplayModule} from "../../lib/swaggerApiDisplay";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {defaultProtocolModule} from "../../lib/defaultProtocol";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {configurationContextModule} from "../../lib/configurationContext/configurationContextModule";
import {HttpServerRouter, HttpServerService} from "../../lib/httpServer";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {authorizationModule} from "../../lib/authorization";
import {ConfigurationContextApiConfig} from "../../lib/configurationContext/config/ConfigurationContextApiConfig";
import {AccessTokenApiConfig} from "../../lib/authorization/config/AccessTokenApiConfig";

export const configurationContextApiKey = "DEV::CONFIGURATION_CONTEXT_API_KEY";
export const accessTokenApiKey = "DEV::ACCESS_TOKEN_MANAGER_KEY";

export const devServerModule: ModuleConfig = {
    requires: [
        authorizationModule,
        configurationContextModule,
        SwaggerApiDisplayModule,
        PermessageDeflateExtensionModule,
        defaultProtocolModule,
        WebsocketListenerModule
    ],
    mappings: [
        PermessageDeflateConfig,
        {
            map: SwaggerApiConfig,
            useValue: {
                basePath: "api",
                docs: [
                    {
                        name: "publish-api",
                        configFile: `${__dirname}/../../../api/publish-api.yaml`
                    },
                    {
                        name: "validation-api",
                        configFile: `${__dirname}/../../../api/validation-api.yaml`
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
        router.post('/validationAPI/validate-connection', ({body, sendJson}) => {
            const {query: {externalId}} = url.parse((body as SocketDescriptor).url, true);
            const response = {externalId: externalId ?? "externalId"};
            sendJson(response);
        });

        const {expressApp: app} = injector.get(HttpServerService);
        app.use("/script", express.static(__dirname + '/script'));
    }
};
