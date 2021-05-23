import { IpcMessenger } from "./IpcMessenger";
import { WorkerManager } from "../../workerManager/service/WorkerManager";
import { EventDispatcher, Inject, PostConstruct } from "quiver-framework";
import { Logger } from "../../logger/service/Logger";
import { IpcMessageEvent } from "../event/IpcMessageEvent";

export class WorkerMessengerProvider {

    @Inject()
    private readonly workerManager: WorkerManager;

    @Inject()
    private readonly eventDispatcher: EventDispatcher;

    @Inject()
    private readonly logger: Logger;

    private readonly messengerCache = new Map<number, IpcMessenger>();

    @PostConstruct()
    private init() {
        const { workerManager: { onNewWorker }, eventDispatcher } = this;
        onNewWorker(worker => {
            const { onMessage } = this.getMessenger(worker.id);
            onMessage(message => eventDispatcher.dispatchEvent(new IpcMessageEvent(message, worker.id)));
        });
    }

    readonly getMessenger = (workerId: number) => {
        const { messengerCache, workerManager: { workers }, logger: { error } } = this;
        if (!messengerCache.has(workerId)) {
            const worker = workers.find(({ id }) => id === workerId);
            if (!worker) {
                error(`WorkerMessengerProvider:getMessenger - worker with id ${JSON.stringify(workerId)} not found`);
                return null;
            }
            messengerCache.set(workerId, IpcMessenger.fromWorker(worker));
            worker.once("exit", () => messengerCache.delete(workerId));
        }
        return messengerCache.get(workerId);
    };
}
