import {Context, EventDispatcher, Injector, WebApplicationBundle} from "qft";
import * as fs from "fs";
import {Logger} from "../../lib/logger";
import {HttpMethod} from "../../lib/types/HttpMethod";
import {EchoServerModule} from "./EchoServerModule";
import {HttpRequestEvent} from "../../lib/httpServer";

const initSocket = async () => {
    const {POST, GET} = HttpMethod;
    const {injector} = new Context()
        .install(...WebApplicationBundle)
        .configure(EchoServerModule)
        .initialize();

    const eventDispatcher = injector.get(EventDispatcher);

    eventDispatcher.addEventListener(HttpRequestEvent.TYPE, ({response}: HttpRequestEvent) => {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(fs.readFileSync(`${__dirname}/index.html`));
        response.end();
    }).withGuards(({request: {method, url}}: HttpRequestEvent) => method === GET && url === '/');

    eventDispatcher.addEventListener(HttpRequestEvent.TYPE, async ({request, response}: HttpRequestEvent) => {
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
    }).withGuards(({request: {method, url}}: HttpRequestEvent) => method === POST && url === '/validate-socket');

    injector.get(Logger).console(`Web socket context initialized`);
};

initSocket();
