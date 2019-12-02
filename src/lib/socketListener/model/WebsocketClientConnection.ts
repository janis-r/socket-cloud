import {Socket} from "net";
import * as crypto from "crypto";
import {EventDispatcher, EventListener, referenceToString} from "qft";
import {composeWebsocketFrame, decomposeWebSocketFrame} from "../util/websocket-utils";
import {createDataFrame, WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {frameTypeToString, WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
import {isPromise} from "../util/is-promise";
import {
    ClientConnection,
    ConnectionState,
    connectionStateToString,
    ErrorEvent,
    MessageEvent,
    StateChangeEvent
} from "../../socketServer";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {ConfigurationContext} from "../../configurationContext";
import {WebsocketCloseCode} from "../data/WebsocketCloseCode";
import {WebsocketDescriptor} from "../data/SocketDescriptor";

export class WebsocketClientConnection extends EventDispatcher implements ClientConnection {

    private _state = ConnectionState.CONNECTING;
    private readonly dataFrames = new Set<WebsocketDataFrame>();
    private readonly incomingMessageQueue = new Set<Promise<void>>();
    private writeBufferIsFull = false;
    private readonly outgoingMessageQueue = new Array<Buffer>();

    private readonly pingTimeout: number;
    private pingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly pingsInProgress = new Map<string, number>();

    constructor(readonly descriptor: WebsocketDescriptor,
                readonly context: ConfigurationContext,
                private readonly socket: Socket,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();

        socket.once("ready", () => this.setState(ConnectionState.OPEN));
        socket.on("data", this.incomingDataHandler);
        socket.on("error", err => {
            console.log(`WebsocketClientConnection socket err: ${JSON.stringify(err.message)}`);
            this.dispatchEvent(new ErrorEvent(this, err.message));
            this.setState(ConnectionState.CLOSING);
            this.socket.end();
        });
        socket.on("close", () => this.setState(ConnectionState.CLOSED));

        if (context.pingTimeout) {
            this.pingTimeout = context.pingTimeout;
            this.startPingTimeout();
            socket.on("data", this.resetPingTimeout);
        }
    }

    get state(): ConnectionState {
        return this._state;
    }

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object) {
        return super.addEventListener(eventNameProxy(event), listener, scope);
    }

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    removeEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): boolean {
        return super.removeEventListener(eventNameProxy(event), listener, scope);
    }

    send(data: Buffer);
    send(data: string);
    async send(data: string | Buffer): Promise<void> {
        const {extensions} = this;
        const {TextFrame, BinaryFrame} = WebsocketDataFrameType;
        const [type, payload] = typeof data === "string" ? [TextFrame, Buffer.from(data)] : [BinaryFrame, data];

        let dataFrame = createDataFrame(type, {payload});
        if (extensions && extensions.length > 0) {
            const validExtensions = extensions.filter(({transformOutgoingData}) => !!transformOutgoingData);
            for (const extension of validExtensions) {
                const transformation = extension.transformOutgoingData(dataFrame);
                dataFrame = isPromise(transformation) ? await transformation : transformation;
            }
        }
        this.sendFrameData(dataFrame);
    }

    private sendFrameData(dataFrame: WebsocketDataFrame): void {
        const {socket, writeBufferIsFull, outgoingMessageQueue, resendData} = this;
        const binaryData = composeWebsocketFrame(dataFrame);
        if (writeBufferIsFull) {
            outgoingMessageQueue.push(binaryData);
            return;
        }

        // If there is backpressure, write returns false and the you should wait for drain
        // to be emitted before writing additional data.
        const success = socket.write(binaryData, err => err && console.log('socket.write err', err));
        if (!success) {
            outgoingMessageQueue.push(binaryData);
            this.writeBufferIsFull = true;
            socket.once("drain", this.resendData);
        }
    }

    private readonly resendData = () => {
        const {socket, outgoingMessageQueue} = this;
        while (outgoingMessageQueue.length > 0) {
            const success = socket.write(outgoingMessageQueue[0], err => err && console.log('socket.write err II', err));
            if (!success) {
                socket.once("drain", this.resendData);
                return;
            }
            outgoingMessageQueue.shift();
        }
        this.writeBufferIsFull = false;
    };

    private readonly incomingDataHandler = async (data: Buffer) => {
        const {incomingMessageQueue: queue} = this;
        const process = new Promise<void>(async resolve => {
            if (queue.size > 0) {
                await Promise.all([...queue]);
            }
            await this.processIncomingDataFrame(data);
            resolve();
        });

        queue.add(process);
        await process;
        queue.delete(process);
    };

    private async processIncomingDataFrame(data: Buffer): Promise<void> {
        const {socket, extensions} = this;

        const id = Math.floor(Math.random() * 0xFFFF).toString(16);
        console.log(`\n>> [${id}] incomingDataHandler`, data.length, 'bytes,', data.toString("hex").substr(0, 50) + '...');

        let dataFrame: WebsocketDataFrame;
        try {
            dataFrame = decomposeWebSocketFrame(data);
            console.log(`>> [${id}] type`, {type: frameTypeToString(dataFrame.type), isFinal: dataFrame.isFinal});
            console.log(`>> [${id}] extensions`, extensions ? extensions.map(e => referenceToString(e.constructor)) : null);
            if (extensions && extensions.length > 0) {
                for (const extension of extensions.filter(({transformIncomingData}) => !!transformIncomingData)) {
                    const transformation = extension.transformIncomingData(dataFrame);
                    dataFrame = isPromise(transformation) ? await transformation : transformation;
                }
            }
            console.log(`>> [${id}] payload len`, dataFrame.payload.toString("utf8").length/*, dataFrame.payload.toString("hex")*/);
            // process.exit();
        } catch (e) {
            console.log(`>> [${id}] e@decomposeWebSocketFrame`, id, e.message);
            process.exit();
            return;
        }

        switch (dataFrame.type) {
            case WebsocketDataFrameType.ContinuationFrame:
            case WebsocketDataFrameType.TextFrame:
            case WebsocketDataFrameType.BinaryFrame:
                this.processDataFrame(dataFrame);
                break;
            case WebsocketDataFrameType.ConnectionClose:
                this.processConnectionCloseFrame(dataFrame);
                break;
            case WebsocketDataFrameType.Ping:
                this.processPingFrame(dataFrame);
                break;
            case WebsocketDataFrameType.Pong:
                this.processPongFrame(dataFrame);
                break;
            default:
                this.setState(ConnectionState.CLOSING);
                this.dispatchEvent(new ErrorEvent(this, `Unknown frame type (${dataFrame.type}) encountered in data frame: ${JSON.stringify(dataFrame)}`));
                socket.end("HTTP/1.1 400 Bad Request");
        }
    }

    private processDataFrame(dataFrame: WebsocketDataFrame): void {
        const {dataFrames} = this;

        dataFrames.add(dataFrame);
        if (!dataFrame.isFinal) {
            return;
        }

        const messageBuffer = dataFrames.size === 1 ? [...dataFrames][0].payload : Buffer.concat([...dataFrames].map(({payload}) => payload));
        const isTextData = [...dataFrames][0].type === WebsocketDataFrameType.TextFrame;
        if (isTextData) {
            const message = messageBuffer.toString("utf8");
            console.log(message.substr(0, 100));
            this.dispatchEvent(new MessageEvent(this, message));
        } else {
            // TODO: Add support for binary data
            throw new Error('Binary data frames are not implemented')
        }

        this.ping();
    }

    private processConnectionCloseFrame({payload}: WebsocketDataFrame): void {
        const closeCode = payload && payload.length > 0 ? parseInt(payload.toString("hex"), 16) : WebsocketCloseCode.NoStatusRcvd;
        console.log({closeCode});
        this.setState(ConnectionState.CLOSING);
        this.socket.end();
    }

    private processPingFrame({payload}: WebsocketDataFrame): void {
        // Send pong back with same payload
        this.sendFrameData(createDataFrame(WebsocketDataFrameType.Pong, {payload}));
    }

    private processPongFrame({payload}: WebsocketDataFrame): void {
        const {pingsInProgress} = this;

        const strPayload = payload.toString("hex");
        // A Pong frame MAY be sent unsolicited. This serves as a
        // unidirectional heartbeat. A response to an unsolicited Pong frame is
        // not expected.
        if (pingsInProgress.has(strPayload)) {
            const time = Date.now() - pingsInProgress.get(strPayload);
            console.log('>> Ping time:', time, 'ms');
            pingsInProgress.delete(strPayload);
        }
    }

    private readonly ping = (): void => {
        const {pingsInProgress} = this;
        const payload = crypto.randomBytes(4);
        pingsInProgress.set(payload.toString("hex"), Date.now());
        console.log('>> ping', {pingsInProgress});
        this.sendFrameData(createDataFrame(WebsocketDataFrameType.Ping, {payload}));
    };

    private startPingTimeout(): void {
        const {pingTimeout, ping} = this;
        this.pingTimeoutId = setTimeout(ping, pingTimeout);
    }

    private readonly resetPingTimeout = (): void => {
        const {pingTimeoutId} = this;
        if (pingTimeoutId) {
            clearTimeout(pingTimeoutId);
            this.pingTimeoutId = null;
        }
        this.startPingTimeout();
    };

    private setState(newState: ConnectionState): void {
        console.log('>> setState', {
            currentState: connectionStateToString(this._state),
            newState: connectionStateToString(newState)
        });
        if (this._state === newState) {
            throw new Error(`Error while transitioning ws connection state: ${{currentState: this._state, newState}}`);
        }

        const prevState = this._state;
        this._state = newState;
        this.dispatchEvent(new StateChangeEvent(this, prevState));

        if (newState === ConnectionState.CLOSING && this.pingTimeoutId) {
            clearTimeout(this.pingTimeoutId);
            this.pingTimeoutId = null;
        }
    }

}

const eventNameProxy = (event: string | Symbol): string | Symbol => {
    switch (event) {
        case "message" :
            return MessageEvent.TYPE;
        case "error" :
            return ErrorEvent.TYPE;
        case "state-change":
            return StateChangeEvent.TYPE;
        default:
            return event;
    }
};
