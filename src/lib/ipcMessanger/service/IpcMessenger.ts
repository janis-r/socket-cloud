import * as cluster from "cluster";
import {toMilliseconds} from "ugd10a";
import {EventDispatcher, Inject} from "qft";
import {IpcMessage, ipcMessageUtil} from "../data/IpcMessage";
import {IpcMessageEvent} from "../event/IpcMessageEvent";
import {Logger} from "../../logger";
import MessageListener = NodeJS.MessageListener;

/**
 * Ipc messenger worker process implementation, will send messages to parent process
 */
export class IpcMessenger {
    @Inject()
    private readonly eventDispatcher: EventDispatcher;
    @Inject()
    private readonly logger: Logger;

    private readonly responseQueue = new Map<IpcMessage['id'], (data: any) => void>();

    constructor() {
        process.on("message", this.messageHandler);
    }

    private readonly messageHandler: MessageListener = message => {
        const {responseQueue, eventDispatcher} = this;

        if (!ipcMessageUtil.validate(message)) {
            throw new Error(`Unknown IPC response format: ${JSON.stringify(message)}`);
        }

        const {id, payload} = message;
        if (responseQueue.has(id)) {
            responseQueue.get(id)(payload);
        } else {
            eventDispatcher.dispatchEvent(new IpcMessageEvent(message, (response: Omit<IpcMessage, "id">) => {
                const data = {...response, id: message.id};
                process.send(data);
            }));
        }
    };


    readonly send = async (message: Omit<IpcMessage, "id">): Promise<void> => {
        const data = {...message, id: getNextIpcMessageId()};
        console.log('>> IpcMessengerInWorker send', data);
        process.send(data);
    };

    readonly sendAndReceive = <RT>(message: Omit<IpcMessage, "id">) => new Promise<RT>((resolve, reject) => {
        const {responseQueue, logger: {debug}} = this;

        const data = {...message, id: getNextIpcMessageId()};
        if (!ipcMessageUtil.validate(data)) {
            throw new Error('!messageUtil.validate(data) ' + data);
        }
        debug(`>> worker#${cluster?.worker?.id} send&receive`, JSON.stringify(data, null, ' '));

        let timedOutId: ReturnType<typeof setTimeout>;
        responseQueue.set(data.id, msg => {
            clearTimeout(timedOutId);
            responseQueue.delete(data.id);
            console.log('>> IPC resolve', msg);
            resolve(msg);
        });

        timedOutId = setTimeout(() => {
            responseQueue.delete(data.id);
            reject('Timed out!');
        }, toMilliseconds(5, "seconds"));

        process.send(data);
    });
}


let mid = 0;

const prefix = cluster?.worker?.id;

function getNextIpcMessageId(): string {
    const id = mid++;
    mid %= 0xFFFF;
    return `${prefix ?? ''}#${id}`;
}
