import * as http from "http";
import {Context, WebApplicationBundle} from "qft";
import * as fs from "fs";
import {WebSocketListenerModule} from "../../lib/socketListener";
import {Logger} from "../../lib/logger";
import {HttpMethod} from "../../lib/types/HttpMethod";

const initHttpServer = async (port = 8000) => {
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
    injector.get(Logger).console(`Web socket context initialized`);
};

initHttpServer().then(initSocket);
