import cluster, { Worker } from "cluster";
import { toMilliseconds } from "ugd10a";
import { IpcMessage, IpcMessageId, ipcMessageUtil } from "../data/IpcMessage";
import { nextIpcMessageId } from "../util/nextIpcMessageId";
import { CallbackCollection } from "../../utils/CallbackCollection";
import MessageListener = NodeJS.MessageListener;

export class IpcMessenger {

    static fromCurrentProcess = () => {
        if (cluster.isMaster) {
            throw new Error(`IpcMessenger.fromCurrentProcess can be used only within worker process`);
        }
        return new IpcMessenger({
            onMessage: listener => process.on("message", listener),
            sendMessage: message => process.send(message)
        }, 'M');
    };

    static fromWorker = (worker: Worker) => {
        if (!cluster.isMaster) {
            throw new Error(`IpcMessenger.fromWorker can be used only within master process`);
        }
        return new IpcMessenger({
            onMessage: listener => worker.on("message", listener),
            sendMessage: message => worker.send(message),
        }, `S${worker.id.toString().padStart(2, "0")}`);
    };

    readonly iid = (cluster.isMaster ? "M" : "S" + cluster.worker.id.toString().padStart(2, "0")) + "|";

    private readonly responseQueue = new Map<IpcMessageId, (data: any) => void>();
    private readonly onMessageCallback = new CallbackCollection<IpcMessage>();
    readonly onMessage = this.onMessageCallback.manage;

    private constructor(private readonly transport: {
        onMessage: (listener: MessageListener) => void,
        sendMessage: (message: any) => void
    }, readonly target: string) {
        if (!transport) {
            throw new Error(`Transport is not provided for IpcMessenger. ${JSON.stringify(arguments)}`)
        }
        transport.onMessage(this.messageHandler);
        this.iid += target;
    }

    private readonly messageHandler: MessageListener = message => {
        const { responseQueue, onMessageCallback } = this;

        if (!ipcMessageUtil.validate(message)) {
            throw new Error(`Unknown IPC response: ${JSON.stringify(message)} - ${JSON.stringify(ipcMessageUtil.lastError)}`);
        }

        const { id, payload } = message;
        if (responseQueue.has(id)) {
            responseQueue.get(id)(payload);
        } else {
            onMessageCallback.execute(message);
        }
    };

    /**
     * Send message to party on other side of IPC messaging.
     * @param message A message to be sent.
     */
    readonly send = (message: IpcMessageWithOptionalId): void => {
        const { transport: { sendMessage } } = this;
        if (!message.id) {
            message.id = nextIpcMessageId();
        }
        sendMessage(message);
    };

    /**
     * Send message to party on other side of IPC messaging and await for response.
     * @template T Expected data type of response
     * @param message
     */
    readonly sendAndReceive = <T>(message: IpcMessageWithOptionalId) => new Promise<T>((resolve, reject) => {
        const { responseQueue, transport: { sendMessage } } = this;

        if (!message?.id) {
            message.id = nextIpcMessageId();
        }

        if (!ipcMessageUtil.validate(message)) {
            throw new Error(`Invalid message @ sendAndReceive - message:${JSON.stringify(message)}, err: ${ipcMessageUtil.lastError}`);
        }

        let timedOutId: ReturnType<typeof setTimeout>;
        responseQueue.set(message.id, response => {
            clearTimeout(timedOutId);
            responseQueue.delete(message.id);
            resolve(response);
        });

        timedOutId = setTimeout(() => {
            responseQueue.delete(message.id);
            reject('Timed out!');
        }, toMilliseconds(5, "seconds"));

        sendMessage(message);
    });
}

type IpcMessageWithOptionalId = Partial<Pick<IpcMessage, "id">> & Omit<IpcMessage, "id">;
