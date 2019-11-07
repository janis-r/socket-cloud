import * as http from "http";
import {Context, WebApplicationBundle} from "qft";
import {WebSocketListenerModule} from "../../lib/webSocketListener";
import {Logger} from "../../lib/logger";
import * as fs from "fs";

const initHttpServer = async (port = 8000) => {
    enum HttpMethod {
        GET = "GET",
        POST = "POST"
    }

    const server = http.createServer((req, res) => {
        const {method, url} = req;
        console.log({method, url});

        if (method == HttpMethod.GET && url === '/') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(fs.readFileSync(`${__dirname}/index.html`));
            res.end();
            return;
        }

        if (method == HttpMethod.POST && url === '/validate-socket') {
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
        .configure(WebSocketListenerModule)
        .initialize();
    injector.get(Logger).console(`Context initialized`);
};

initHttpServer()
    .then(initSocket)
/*.then(() => {
    const options = {
        port: 8001,
        host: 'localhost',
        headers: {
            'Connection': 'Upgrade',
            'Upgrade': 'websocket',
            'sec-websocket-key': 'L+TKCTxD1hH17zO+in0cDA=='
            // expecting `Sec-WebSocket-Accept: 3Py0MLF/du8gtJnh0oO0B2d1xiQ=` in response
        }
    };

    const req = http.request(options);
    req.end();

    req.on('upgrade', (res, socket, upgradeHead) => {
        console.log('got upgraded!');
        socket.end();
        process.exit(0);
    });
});*/
