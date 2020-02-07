import {IpcMessenger} from "./IpcMessenger";
import {WorkerManager} from "../../workerManager/service/WorkerManager";
import {Inject} from "qft";
import {Logger} from "../../logger";

export class WorkerMessengerProvider {

    @Inject()
    private readonly workerManager: WorkerManager;
    @Inject()
    private readonly logger: Logger;

    private readonly messengerCache = new Map<number, IpcMessenger>();

    readonly getMessenger = (workerId: number) => {
        const {messengerCache, workerManager, logger: {error}} = this;
        if (!messengerCache.has(workerId)) {
            const worker = workerManager.workers.find(({id}) => id === workerId);
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
