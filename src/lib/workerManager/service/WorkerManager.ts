import cluster, {Worker} from "cluster";
import {cpus} from 'os';
import {CallbackCollection} from "../../utils/CallbackCollection";

export class WorkerManager {

    private readonly maxWorkers: number;

    private readonly onNewWorkerCallback = new CallbackCollection<Worker>();
    private readonly onWorkerExitCallback = new CallbackCollection<{ worker: Worker, code: number, signal: string }>();

    readonly onNewWorker = this.onNewWorkerCallback.manage;
    readonly onWorkerExit = this.onWorkerExitCallback.manage;

    constructor() {
        this.maxWorkers = cpus().length;
        console.log(`Starting worker manager on ${this.maxWorkers}/${cpus().length} CPUs`);
        cluster.on("exit", (worker, code, signal) => {
            this.onWorkerExitCallback.execute({worker, code, signal});
            console.log(`worker ${worker.id} died ${{code, signal}}`);
            // TODO: Should we respawn worker here or this could be due to some serious problem which will be only reiterated on respawn?
        });

        this.spawnWorkers();
    }

    private spawnWorkers(): void {
        const {maxWorkers} = this;
        let startedWorkers = 0;
        while (Object.keys(cluster.workers).length < maxWorkers) {
            const worker = cluster.fork();
            worker.on("error", err => {
                console.log(`worker ${worker.id} error:`, err);
            });
            worker.on("listening", address => {
                startedWorkers++;
                if (startedWorkers === maxWorkers) {
                    console.log(`All workers started`);
                }
                this.onNewWorkerCallback.execute(worker);
            });
        }
    }

    get workers(): Worker[] {
        return Object.values(cluster.workers);
    }

    get workerIds(): number[] {
        return Object.keys(cluster.workers).map(v => parseInt(v));
    }
}
