import {Context, InjectionConfig, WebApplicationBundle} from "qft";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {Logger} from "../../lib/logger";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {HttpServerRouter} from "../../lib/httpServer";
import {SwaggerApiConfig, SwaggerApiDisplayModule} from "../../lib/swaggerApiDisplay";


const {injector} = new Context().install(...WebApplicationBundle).configure(
    SwaggerApiDisplayModule,
    WebsocketListenerModule,
    PermessageDeflateExtensionModule,
    {
        mappings: [
            PermessageDeflateConfig,
            {
                map: SwaggerApiConfig,
                useValue: {
                    basePath: "api",
                    docs: [{
                        name: "operator",
                        configFile: `${__dirname}/../../../api/operator-api.yaml`
                    }, {
                        name: "validation",
                        configFile: `${__dirname}/../../../api/validation-api.yaml`
                    }]
                }
            } as InjectionConfig<SwaggerApiConfig>
        ]
    }
).initialize();

const router = injector.get(HttpServerRouter);
router.get('/', ({sendFile}) => sendFile(`${__dirname}/index.html`));

router.post('/validate-connection', ({body, sendJson}) => {
    console.log({body});
    sendJson({externalId: "1234"});
});

injector.get(Logger).console(`Dev server context initialized`);
