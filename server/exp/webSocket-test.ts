import {webSocketAcceptResponse} from "../../src/lib/webSocketListener/util/webSocketAcceptResponse";

const cluster = require("cluster");
const http = require('http');

if (cluster.isMaster) {
    const numCPUs = require('os').cpus().length;

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        worker.on('message', (msg: any) => {
            console.log('worker message', {msg});
        });
    }

    cluster.on("message", (worker, message, handle) => {
        console.log('cluster message', {worker: worker.id, message, handle});
    });

} else {

    const {id: workerID} = cluster.worker;
    console.log('workerID', workerID);

    const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('okay');
    });
    server.on('upgrade', (req, socket, head) => {
        console.log(req.headers);
        const responseHeaders = [
            'HTTP/1.1 101 Web Socket Protocol Handshake',
            'Upgrade: WebSocket',
            'Connection: Upgrade',
            'Sec-WebSocket-Accept: ' + webSocketAcceptResponse(req.headers['sec-websocket-key'])
        ];
        console.log(responseHeaders.join('\r\n'));
        socket.write(responseHeaders.join('\r\n') + '\r\n');
        // socket.pipe(socket); // echo back
    });

    // Now that server is running
    server.listen(1337, '127.0.0.1', () => {
        // make a request
        /*const options = {
            port: 1337,
            host: '127.0.0.1',
            headers: {
                'Connection': 'Upgrade',
                'Upgrade': 'websocket'
            }
        };

        const req = http.request(options);
        req.end();

        req.on('upgrade', (res, socket, upgradeHead) => {
            console.log('got upgraded!');
            socket.end();
            process.exit(0);
        });*/
    });

}
