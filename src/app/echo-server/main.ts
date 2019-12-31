import {Context, EventDispatcher, WebApplicationBundle} from "qft";
import * as fs from "fs";
import {Logger} from "../../lib/logger";
import {HttpMethod} from "../../lib/types/HttpMethod";
import {EchoServerModule} from "./EchoServerModule";
import {HttpRequestEvent} from "../../lib/httpServer";

const {POST, GET} = HttpMethod;
const {injector} = new Context()
    .install(...WebApplicationBundle)
    .configure(EchoServerModule)
    .initialize();

const eventDispatcher = injector.get(EventDispatcher);

const echoIndexFile = ({response}: HttpRequestEvent) => {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(fs.readFileSync(`${__dirname}/index.html`));
    response.end();
};
const approveSocketConnection = async ({request, response}: HttpRequestEvent) => {
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
};

eventDispatcher.addEventListener(HttpRequestEvent.TYPE, echoIndexFile).withGuards(
    ({request: {method, url}}) => method === GET && url === '/'
);
eventDispatcher.addEventListener(HttpRequestEvent.TYPE, approveSocketConnection).withGuards(
    ({request: {method, url}}) => method === POST && url === '/validate-socket'
);

injector.get(Logger).console(`Context initialized`);
