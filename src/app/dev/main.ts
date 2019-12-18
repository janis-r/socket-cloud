import * as http from "http";
import {Context, Injector, ModuleConfig, WebApplicationBundle} from "qft";
import * as fs from "fs";
import {WebSocketListenerConfig, WebsocketListenerModule} from "../../lib/websocketListener";
import {Logger} from "../../lib/logger";
import {HttpMethod} from "../../lib/types/HttpMethod";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";

const httpServerPort = 8000;
let contextInjector: Injector;

const initHttpServer = async (port = httpServerPort) => {
    const server = http.createServer(async (req, res) => {
        const {method, url} = req;
        console.log({method, url});

        if (method == HttpMethod.GET && url === '/') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(fs.readFileSync(`${__dirname}/index.html`));
            res.end();
            return;
        }

        if (method == HttpMethod.POST && url === '/validate-socket') {
            await new Promise<void>(resolve => {
                const chunks: Buffer[] = [];
                req.on("data", chunk => chunks.push(chunk));
                req.on("end", () => {
                    console.log({body: JSON.parse(Buffer.concat(chunks).toString("utf8"))});
                    resolve();
                });
            });
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(true));
            res.end();
            return;
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(`url:${req.url}, method: ${req.method}`);
        res.end();
    });
    server.listen(port, () => console.log(`Http server running at http://localhost:${port}`));
};

const initSocket = async () => {
    const {injector} = new Context()
        .install(...WebApplicationBundle)
        .configure(
            WebsocketListenerModule,
            PermessageDeflateExtensionModule,
            <ModuleConfig> {
                mappings: [
                    // { map: PermessageDeflateConfig, useValue: {}}
                    PermessageDeflateConfig
                ]
            }
        )
        .initialize();
    injector.get(Logger).console(`Web socket context initialized`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    contextInjector = injector;
};

const createConnection = async () => {
    const {webSocketPort: port} = contextInjector.get(WebSocketListenerConfig);
    const options = {
        port,
        host: 'localhost',
        headers: {
            'Connection': 'Upgrade',
            'Upgrade': 'websocket',
            'Sec-WebSocket-Key': 'L+TKCTxD1hH17zO+in0cDA==',
            'origin': `http://localhost:${port}`,
        }
    };

    const req = http.request(options);
    req.end();

    req.on('upgrade', (res, socket, upgradeHead) => {
        console.log('got upgraded!');

        socket.on("connect", () => console.log('socket on connect'));
        socket.on("data", (data: Buffer) => console.log('socket on data', data));
        socket.on("error", (err: Error) => console.log('socket on error', err));
        socket.on("end", () => console.log('socket on end   '));

        socket.write('Hello server, this is client!');
    });
};


initHttpServer()
    .then(initSocket)
    // .then(createConnection);
