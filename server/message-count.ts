import {IncomingMessage, ServerResponse} from "http";

const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

    // Keep track of http requests
    let numReqs = 0;
    // setInterval(() => console.log(`numReqs = ${numReqs}`), 1000);


    // Start workers and listen for messages containing notifyRequest
    const numCPUs = require('os').cpus().length;
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        worker.on('message', (msg: any) => {
            numReqs++;
            console.log('>> msg', numReqs, msg, "\n");
            worker.send({numReqs});
            worker.kill();
            console.log('>> workers', Object.keys(cluster.workers).length);
            console.log("\n");
        });
    }

    /*for (const worker of cluster.workers) {
        console.log({worker})
        worker.on('message', (msg: any) => {
            console.log('>> msg', msg)
            if (msg.cmd && msg.cmd === 'notifyRequest') {
                numReqs += 1;
            }
            worker.kill();
            console.log('>> wl', cluster.workers.length)
        });
    }*/
} else {

    // Worker processes have a http server.
    const server = http.Server((req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(200);
        res.end('hello world\n');

        const {method, complete, headers, statusCode, url} = req;
        if (url === '/favicon.ico') {
            return;
        }

        console.log('<------------------------------>')
        console.log({pid: process.pid, isMaster: cluster.isMaster})

        console.log({method, url})
        console.log('</------------------------------>');

        process.send!({cmd: 'notifyRequest'});
    });

    server.listen(8000);
    process.on('message', (msg: any) => {
        console.log(msg, process.pid)
    });

}
