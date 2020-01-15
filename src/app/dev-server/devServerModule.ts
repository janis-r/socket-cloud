import {InjectionConfig, Module} from "qft";
import {SwaggerApiConfig, SwaggerApiDisplayModule} from "../../lib/swaggerApiDisplay";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {Logger} from "../../lib/logger";
import * as cluster from "cluster";

@Module({
    requires: [
        SwaggerApiDisplayModule,
        WebsocketListenerModule,
        PermessageDeflateExtensionModule
    ],
    mappings: [
        PermessageDeflateConfig,
        {
            map: SwaggerApiConfig,
            useValue: {
                basePath: "api",
                docs: [{
                    name: "platform",
                    configFile: `${__dirname}/../../../api/platform-api.yaml`
                }, {
                    name: "validation",
                    configFile: `${__dirname}/../../../api/validation-api.yaml`
                }]
            }
        } as InjectionConfig<SwaggerApiConfig>
    ]
})
export class DevServerModule {
    constructor(logger: Logger) {
        logger.context = cluster?.worker?.id.toString();
    }
}
