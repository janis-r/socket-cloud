import cluster, {Worker} from "cluster";
import {cpus} from 'os';
import {EventDispatcher, Inject} from "quiver-framework";
import {WorkerMessageEvent} from "../event/WorkerMessageEvent";

export class WorkerManager {
    @Inject()
    private readonly eventDispatcher: EventDispatcher;

    private readonly maxWorkers: number;

    constructor() {
        this.maxWorkers = cpus().length;
        console.log(`Starting worker manager on ${this.maxWorkers}/${cpus().length} CPUs`);

        cluster.on("message", (worker, message) => this.messageHandler(message, worker.id));
        cluster.on("exit", (worker, code, signal) => {
            console.log(`worker ${worker.id} died`);
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
            });
        }
    }

    private messageHandler(message: any, workerId: number): void {
        const {eventDispatcher} = this;
        eventDispatcher.dispatchEvent(new WorkerMessageEvent(message, workerId));
    }

    get workers(): Worker[] {
        return Object.values(cluster.workers);
    }

    get workerIds(): number[] {
        return Object.keys(cluster.workers).map(v => parseInt(v));
    }
}
