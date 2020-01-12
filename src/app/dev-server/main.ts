import {Context, WebApplicationBundle} from "qft";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {Logger} from "../../lib/logger";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {HttpServerRouter} from "../../lib/httpServer";


const {injector} = new Context().install(...WebApplicationBundle).configure(
    WebsocketListenerModule,
    PermessageDeflateExtensionModule,
    {
        mappings: [
            PermessageDeflateConfig
        ]
    }
).initialize();

const router = injector.get(HttpServerRouter);
router.get('/', ({sendFile}) => sendFile(`${__dirname}/index.html`));

router.post('/validate-socket', ({body, sendJson}) => {
    console.log({body});
    sendJson(true);
});

injector.get(Logger).console(`Dev server context initialized`);
