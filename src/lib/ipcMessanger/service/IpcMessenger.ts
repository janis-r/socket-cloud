import cluster, {Worker} from "cluster";
import {toMilliseconds} from "ugd10a";
import {IpcMessage, ipcMessageUtil} from "../data/IpcMessage";
import {nextIpcMessageId} from "../util/nextIpcMessageId";
import {CallbackCollection} from "../../utils/CallbackCollection";
import MessageListener = NodeJS.MessageListener;

export class IpcMessenger {

    static fromCurrentProcess = () => {
        if (cluster.isMaster) {
            throw new Error(`IpcMessenger.fromCurrentProcess can be used only within worker process`);
        }
        return new IpcMessenger({
            onMessage: listener => process.on("message", listener),
            sendMessage: message => process.send(message)
        });
    };

    static fromWorker = (worker: Worker) => {
        if (!cluster.isMaster) {
            throw new Error(`IpcMessenger.fromWorker can be used only within master process`);
        }
        return new IpcMessenger({
            onMessage: listener => worker.on("message", listener),
            sendMessage: message => worker.send(message)
        });
    };

    readonly iid = (cluster.isMaster ? "M" : "S") + "|" + Math.floor(Math.random() * 0xFFFF).toString(16);

    private readonly responseQueue = new Map<IpcMessage['id'], (data: any) => void>();
    private readonly onMessageCallback = new CallbackCollection<IpcMessage>();
    readonly onMessage = this.onMessageCallback.polymorph;

    private constructor(private readonly transport: {
        onMessage: (listener: MessageListener) => void,
        sendMessage: (message: any) => void
    }) {
        if (!transport) {
            console.log(JSON.stringify(arguments));
        }
        transport.onMessage(this.messageHandler);
    }

    private readonly messageHandler: MessageListener = (message): void => {
        const {responseQueue, onMessageCallback} = this;

        if (!ipcMessageUtil.validate(message)) {
            throw new Error(`Unknown IPC response: ${JSON.stringify(message)} - ${JSON.stringify(ipcMessageUtil.lastValidationError)}`);
        }
        // console.log([this.iid], 'messageHandler', message);
        const {id, payload} = message;
        if (responseQueue.has(id)) {
            responseQueue.get(id)(payload);
        } else {
            onMessageCallback.execute(message);
        }
    };

    readonly send = (message: IpcMessageWithOptionalId): void => {
        const {transport: {sendMessage}} = this;
        if (!message.id) {
            message.id = nextIpcMessageId();
        }
        sendMessage(message);
    };

    readonly sendAndReceive = <T>(message: IpcMessageWithOptionalId) => new Promise<T>((resolve, reject) => {
        const {iid, responseQueue, transport: {sendMessage}} = this;
        // const rid = Math.floor(Math.random() * 0xFFF).toString(16);
        // console.log([iid, rid], 'message', message)
        if (!message.id) {
            message.id = nextIpcMessageId();
            // console.log([iid, rid], `message.id`, message.id);
        }

        if (!ipcMessageUtil.validate(message)) {
            throw new Error(`Invalid message @ sendAndReceive [${JSON.stringify(message)}]`);
        }

        let timedOutId: ReturnType<typeof setTimeout>;
        responseQueue.set(message.id, response => {
            // console.log([iid, rid], `respond`, {response});

            clearTimeout(timedOutId);
            responseQueue.delete(message.id);
            resolve(response);
        });

        timedOutId = setTimeout(() => {
            // console.log([iid, rid], `timedOutId`);
            responseQueue.delete(message.id);
            reject('Timed out!');
        }, toMilliseconds(5, "seconds"));

        sendMessage(message);
    });
}

type IpcMessageWithOptionalId = Partial<Pick<IpcMessage, "id">> & Omit<IpcMessage, "id">;
