import {Socket} from "net";

const cluster = require("cluster");
const net = require('net');
const http = require('http');
const crypto = require('crypto');

if (cluster.isMaster) {

    let numReqs = 0;
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

    const server = net.createServer((socket: Socket) => {
        // 'connection' listener.
        console.log('client connected', workerID);
        socket.on('end', () => {
            console.log('client disconnected');
        });
        socket.on('upgrade', (req, socket) => {
            console.log('>> upgrade')
            console.log(req)
            if (req.headers['upgrade'] !== 'websocket') {
                socket.end('HTTP/1.1 400 Bad Request');
                return;
            }
        });

        /*socket.on("data", data => {
            const headers = new Map<string, string>(data.toString().split("\r\n")
                .map((line) => line.split(`: `) as [string, string])
                .filter(entry => entry.length === 2)
            );

            console.log('\n', headers);
            const hashValue = headers.get("Sec-WebSocket-Key") + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            console.log('hashValue', hashValue);

            const hash = crypto.createHash('sha1');
            const hashData = hash.update(hashValue, 'utf-8');
            const gen_hash = hashData.digest();
            console.log("hash : " + gen_hash);
            const base64 = Buffer.from(gen_hash).toString('base64')
            console.log("base64 : " + base64);

            socket.write([
                    `HTTP/1.1 101 Switching Protocols`,
                    `Upgrade: websocket`,
                    `Connection: Upgrade`,
                    `Sec-WebSocket-Accept: ${base64}`
                ].join('"\r\n"')
            )
        });*/
        socket.write(`hello${JSON.stringify({workerID})}\r\n`);

        cluster.worker.send('New client')
    });

    server.on('error', (err) => {
        throw err;
    });

    server.listen(8000, () => {
        console.log('server is listening', workerID, server.address());
    });

}
