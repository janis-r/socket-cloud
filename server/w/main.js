const worker_threads = require("worker_threads");
const Worker = worker_threads.Worker;
const path = require('path');

function runWorker(path, cb, workerData = null) {
    const worker = new Worker(path, { workerData });
    worker.on('message', cb.bind(null, null));
    worker.on('error', cb);
    worker.on('exit', (exitCode) => {
        if (exitCode === 0) {
            return null;
        }
        return cb(new Error(`Worker has stopped with code ${exitCode}`));
    });
    return worker;
}


runWorker(path.join(__dirname, 'worker.js'), ((err, result) => {
    console.log({err, result});
}));
runWorker(path.join(__dirname, 'worker.js'), ((err, result) => {
    console.log({err, result});
}));
runWorker(path.join(__dirname, 'worker.js'), ((err, result) => {
    console.log({err, result});
}));


/*type WorkerCallback = (err: any, result?: any) => any;
export function runWorker(path: string, cb: WorkerCallback, workerData: object | null = null) {
    const worker = new Worker(path, { workerData });
    worker.on('message', cb.bind(null, null));
    worker.on('error', cb);
    worker.on('exit', (exitCode) => {
        if (exitCode === 0) {
            return null;
        }
        return cb(new Error(`Worker has stopped with code ${exitCode}`));
    });
    return worker;
}


runWorker(path.join(__dirname, 'worker.js'), ((err, result) => {
    console.log({err, result});
}))
*/
