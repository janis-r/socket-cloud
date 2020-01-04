import * as fs from "fs";
import {Context, WebApplicationBundle} from "qft";
import {IncomingMessage, ServerResponse} from "http";
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
router.get('/', (request: IncomingMessage, response: ServerResponse) => {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(fs.readFileSync(`${__dirname}/index.html`));
    response.end();
});

router.post('/validate-socket', async (request: IncomingMessage, response: ServerResponse) => {
    await new Promise<void>(resolve => {
        const chunks = new Array<Buffer>();
        request.on("data", chunk => chunks.push(chunk));
        request.on("end", () => {
            console.log({body: JSON.parse(Buffer.concat(chunks).toString("utf8"))});
            resolve();
        });
    });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(true));
    response.end();
});

injector.get(Logger).console(`Dev server context initialized`);
