import {Context, WebApplicationBundle} from "qft";
import {WebSocketListenerModule} from "./src/lib/webSocketListener";
import {Logger} from "./src/lib/logger";
import * as http from "http";

const initHttpServer = async (port = 8000) => {
    const {Server} = require('node-static');
    const file = new Server('./');
    const server = http.createServer((req, res) => file.serve(req, res));
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
