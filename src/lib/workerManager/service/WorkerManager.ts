import cluster, {Worker} from "cluster";
import {EventDispatcher, Inject} from "qft";
import {WorkerMessageEvent} from "../event/WorkerMessageEvent";
import {cpus} from 'os';

export class WorkerManager {
    @Inject()
    private readonly eventDispatcher: EventDispatcher;

    constructor() {

        console.log(`Starting worker manager on ${cpus().length} CPUs`);

        cluster.on("message", (worker, message) => this.messageHandler(message, worker.id));
        cluster.on("exit", (worker, code, signal) => {
            console.log(`worker ${worker.id} died`);
            // TODO: Should we respawn worker here or this could be due to some serious problem which will be only reiterated on respawn?
        });

        this.spawnWorkers();
    }

    private spawnWorkers(): void {
        while (Object.keys(cluster.workers).length < cpus().length) {
            const worker = cluster.fork();
            worker.on("error", err => {
                console.log(`worker ${worker.id} error:`, err);
            });
            worker.on("listening", address => {
                console.log(`worker ${worker.id} listening on port:`, address.port);
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
}