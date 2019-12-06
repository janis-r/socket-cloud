import {Socket} from "net";
import * as crypto from "crypto";
import {referenceToString} from "qft";
import {composeWebsocketFrame, fragmentWebsocketFrame} from "../util/websocket-utils";
import {createDataFrame, WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
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
import {ClientConnectionEventBase} from "./ClientConnectionEventBase";
import {WebsocketDataStream} from "../util/WebsocketDataStream";

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private _state = ConnectionState.CONNECTING;
    private readonly dataFrames = new Set<WebsocketDataFrame>();
    private readonly incomingMessageQueue = new Set<Promise<void>>();
    private readonly outgoingMessageProcessingQueue = new Set<Promise<any>>();
    private readonly outgoingMessageSendQueue = new Array<Buffer>();

    private writeBufferIsFull = false;

    private readonly pingTimeout: number;
    private readonly pingsInProgress = new Map<string, number>();
    private nextPingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private connectivityErrorTimoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(readonly descriptor: WebsocketDescriptor,
                readonly context: ConfigurationContext,
                private readonly socket: Socket,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();
        console.log({descriptor, context});

        socket.once("ready", () => this.setState(ConnectionState.OPEN));

        // socket.on("data", this.incomingDataHandler);

        const stream = new WebsocketDataStream(this.incomingDataHandler);
        socket.on("data", data => stream.write(data));

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

    send(data: Buffer);
    send(data: string);
    async send(data: string | Buffer): Promise<void> {
        console.log('>> send', data.toString().substr(0, 20));
        const {
            outgoingMessageProcessingQueue: queue,
            extensions,
            context: {outgoingMessageFragmentSize: fragmentSize}
        } = this;
        const {TextFrame, BinaryFrame} = WebsocketDataFrameType;

        const promiseOfFrames = new Promise<Array<WebsocketDataFrame>>(async resolve => {
            await Promise.all([...queue]);
            const [type, payload] = typeof data === "string" ? [TextFrame, Buffer.from(data)] : [BinaryFrame, data];

            let frames = fragmentWebsocketFrame(type, payload, fragmentSize);
            if (!extensions || !extensions.length) {
                resolve(frames);
                return;
            }

            const validExtensions = extensions.filter(({transformOutgoingData}) => !!transformOutgoingData);
            for (const extension of validExtensions) {
                const transformation = extension.transformOutgoingData(frames);
                frames = isPromise(transformation) ? await transformation : transformation;
            }

            resolve(frames);
        });

        queue.add(promiseOfFrames);
        const dataFrames = await promiseOfFrames;
        queue.delete(promiseOfFrames);

        dataFrames.forEach(frame => this.sendFrameData(frame));
    }

    private sendFrameData(dataFrame: WebsocketDataFrame): void {
        console.log('>> sendFrameData', {
            ...dataFrame,
            payloadLength: dataFrame.payload.length,
            pAsStr: dataFrame.payload.toString("utf8").substr(0, 20)
        });

        const {socket, writeBufferIsFull, outgoingMessageSendQueue} = this;
        const binaryData = composeWebsocketFrame(dataFrame);

        if (writeBufferIsFull) {
            outgoingMessageSendQueue.push(binaryData);
            return;
        }

        // If there is backpressure, write returns false and the you should wait for drain
        // to be emitted before writing additional data.
        const success = socket.write(binaryData, err => err && console.log('socket.write err', err));
        if (!success) {
            outgoingMessageSendQueue.push(binaryData);
            this.writeBufferIsFull = true;
            socket.once("drain", this.resendData);
        }
    }

    private readonly resendData = () => {
        const {socket, outgoingMessageSendQueue} = this;
        while (outgoingMessageSendQueue.length > 0) {
            const success = socket.write(outgoingMessageSendQueue[0], err => err && console.log('socket.write err II', err));
            if (!success) {
                socket.once("drain", this.resendData);
                return;
            }
            outgoingMessageSendQueue.shift();
        }
        this.writeBufferIsFull = false;
    };

    private readonly incomingDataHandler = async (data: WebsocketDataFrame) => {
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

    private async processIncomingDataFrame(dataFrame: WebsocketDataFrame): Promise<void> {
        const {socket} = this;
        switch (dataFrame.type) {
            case WebsocketDataFrameType.ContinuationFrame:
            case WebsocketDataFrameType.TextFrame:
            case WebsocketDataFrameType.BinaryFrame:
                await this.processDataFrame(dataFrame);
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

    private async processDataFrame(dataFrame: WebsocketDataFrame): Promise<void> {
        const {dataFrames, extensions} = this;

        dataFrames.add(dataFrame);
        if (!dataFrame.isFinal) {
            return;
        }

        let frames = [...dataFrames];
        dataFrames.clear();

        extensions && console.log(`>> extensions`, extensions.map(e => referenceToString(e.constructor)));
        if (extensions && extensions.length > 0) {
            for (const extension of extensions.filter(({transformIncomingData}) => !!transformIncomingData)) {
                const transformation = extension.transformIncomingData(frames);
                frames = isPromise(transformation) ? await transformation : transformation;
            }
        }

        const messageBuffer = frames.length === 1 ? frames[0].payload : Buffer.concat(frames.map(({payload}) => payload));
        const isTextData = frames[0].type === WebsocketDataFrameType.TextFrame;

        if (isTextData) {
            const message = messageBuffer.toString("utf8");
            console.log(message.substr(0, 100));
            this.dispatchEvent(new MessageEvent(this, message));
        } else {
            // TODO: Add support for binary data
            throw new Error('Binary data frames are not implemented')
        }
        // this.send(["a", "b"/*, "c"*/].map(char => new Array(10).fill(null).map((v, i) => char + i).join("")).join('-'));
    }

    private processConnectionCloseFrame({payload}: WebsocketDataFrame): void {

        const code = payload.readUInt16BE(0) || WebsocketCloseCode.NoStatusRcvd;
        const reason = payload.length > 2 ? payload.slice(2).toString("utf8") : null;

        const closeCode = payload && payload.length > 0 ? parseInt(payload.toString("hex"), 16) : WebsocketCloseCode.NoStatusRcvd;
        console.log({code, reason});

        const responsePayload = Buffer.alloc(2);
        responsePayload.writeUInt16BE(code, 0);
        // this.sendFrameData(createDataFrame(WebsocketDataFrameType.ConnectionClose, {payload: responsePayload}));

        this.setState(ConnectionState.CLOSING);
        this.socket.end(composeWebsocketFrame(createDataFrame(WebsocketDataFrameType.ConnectionClose, {payload: responsePayload})));
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

            if (this.connectivityErrorTimoutId) {
                clearTimeout(this.connectivityErrorTimoutId);
                this.connectivityErrorTimoutId = null;
            }
        }
    }

    private readonly ping = (): void => {
        const {pingTimeout, pingsInProgress, handleLostConnection} = this;

        const payload = crypto.randomBytes(4);
        pingsInProgress.set(payload.toString("hex"), Date.now());

        console.log('>> ping', {pingsInProgress});
        this.connectivityErrorTimoutId = setTimeout(handleLostConnection, pingTimeout);
        this.sendFrameData(createDataFrame(WebsocketDataFrameType.Ping, {payload}));
    };

    private startPingTimeout(): void {
        const {pingTimeout, ping} = this;
        this.nextPingTimeoutId = setTimeout(ping, pingTimeout);
    }

    private readonly resetPingTimeout = (): void => {
        const {nextPingTimeoutId} = this;
        if (nextPingTimeoutId) {
            clearTimeout(nextPingTimeoutId);
            this.nextPingTimeoutId = null;
        }
        this.startPingTimeout();
    };

    private readonly handleLostConnection = () => {
        this.setState(ConnectionState.CLOSING);
        this.dispatchEvent(new ErrorEvent(this, `Socket connection is lost`));
        this.socket.end();
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

        if (newState === ConnectionState.CLOSING && this.nextPingTimeoutId) {
            clearTimeout(this.nextPingTimeoutId);
            this.nextPingTimeoutId = null;
        }
    }

}
