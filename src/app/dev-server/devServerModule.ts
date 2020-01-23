import * as cluster from "cluster";
import {InjectionConfig, ModuleConfig} from "qft";
import {Logger} from "../../lib/logger";
import {SwaggerApiConfig, SwaggerApiDisplayModule} from "../../lib/swaggerApiDisplay";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {DeliveryProtocolModule} from "../../lib/deliveryProtocol";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {ConfigurationContextModule} from "../../lib/configurationContext/ConfigurationContextModule";
import {HttpServerRouter} from "../../lib/httpServer";
import url from "url";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";

export const devServerModule: ModuleConfig = {
    requires: [
        ConfigurationContextModule,
        SwaggerApiDisplayModule,
        PermessageDeflateExtensionModule,
        DeliveryProtocolModule,
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
                        name: "platform",
                        configFile: `${__dirname}/../../../api/platform-api.yaml`
                    },
                    /*{
                        name: "validation",
                        configFile: `${__dirname}/../../../api/validation-api.yaml`
                    }*/
                ]
            }
        } as InjectionConfig<SwaggerApiConfig>
    ],
    setup: injector => {

        injector.get(Logger).context = cluster?.worker?.id.toString();

        const router = injector.get(HttpServerRouter);
        router.get('/', ({sendFile}) => sendFile(`${__dirname}/index.html`));

        router.post('/validationAPI/validate-connection', ({body, sendJson}) => {
            const {query: {externalId}} = url.parse((body as SocketDescriptor).url, true);
            const response = {externalId: externalId ?? "externalId"};
            // console.log('>> validate-connection', {body, response});
            sendJson(response);
        });
    }
};
