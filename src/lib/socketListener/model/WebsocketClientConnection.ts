import {Socket} from "net";
import * as crypto from "crypto";
import {referenceToString} from "qft";
import {composeWebsocketFrame, fragmentWebsocketFrame, spawnFrameData} from "../util/websocket-utils";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
import {isPromise} from "../../utils/is-promise";
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
import {WebsocketIncomingDataBuffer} from "../util/WebsocketIncomingDataBuffer";
import {WebsocketOutgoingDataBuffer} from "../util/WebsocketOutgoingDataBuffer";

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private _state = ConnectionState.CONNECTING;
    private readonly incomingDataBuffer = new WebsocketIncomingDataBuffer();
    private readonly outgoingDataBuffer: WebsocketOutgoingDataBuffer;

    private readonly dataFrames = new Set<WebsocketDataFrame>();
    private readonly incomingMessageQueue = new Set<Promise<void>>();
    private readonly outgoingMessageProcessingQueue = new Set<Promise<any>>();

    private readonly pingTimeout: number;
    private readonly pingsInProgress = new Map<string, number>();
    private nextPingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private connectivityErrorTimoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(readonly descriptor: WebsocketDescriptor,
                readonly context: ConfigurationContext,
                private readonly socket: Socket,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();

        this.outgoingDataBuffer = new WebsocketOutgoingDataBuffer(socket);

        const {incomingDataBuffer, incomingDataHandler, resetPingTimeout} = this;

        console.log({descriptor, context});

        socket.once("ready", () => {
            this.setState(ConnectionState.OPEN);
            throw new Error("READY");
        });

        incomingDataBuffer.addEventListener("data", ({data}) => incomingDataHandler(data));
        socket.on("data", data => incomingDataBuffer.write(data));
        socket.once("error", err => {
            console.log(`WebsocketClientConnection socket err: ${JSON.stringify(err.message)}`);
            this.dispatchEvent(new ErrorEvent(this, err.message));
            this.close(WebsocketCloseCode.AbnormalClosure);
        });
        socket.on("close", () => this.setState(ConnectionState.CLOSED));

        if (context.pingTimeout) {
            this.pingTimeout = context.pingTimeout;
            this.startPingTimeout();
            socket.on("data", resetPingTimeout);
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
            context: {outgoingMessageFragmentSize: fragmentSize},
            outgoingDataBuffer
        } = this;
        const {TextFrame, BinaryFrame} = WebsocketDataFrameType;

        const process = new Promise<void>(async resolve => {
            await Promise.all([...queue]);
            const [type, payload] = typeof data === "string" ? [TextFrame, Buffer.from(data)] : [BinaryFrame, data];

            let frames = fragmentWebsocketFrame(type, payload, fragmentSize);
            if (extensions && extensions.length) {
                const validExtensions = extensions.filter(({transformOutgoingData}) => !!transformOutgoingData);
                for (const extension of validExtensions) {
                    const transformation = extension.transformOutgoingData(frames);
                    frames = isPromise(transformation) ? await transformation : transformation;
                }
            }

            await outgoingDataBuffer.write(frames.map(frame => composeWebsocketFrame(frame)));
            resolve();
        });

        queue.add(process);
        await process;
        queue.delete(process);
    }

    close(code: WebsocketCloseCode = WebsocketCloseCode.NormalClosure): boolean {
        const {state, setState, socket} = this;
        if (state >= ConnectionState.CLOSING) {
            return false;
        }

        const payload = Buffer.alloc(2);
        payload.writeUInt16BE(code, 0);

        setState(ConnectionState.CLOSING);
        socket.end(spawnFrameData(WebsocketDataFrameType.ConnectionClose, {payload}).render());
    }

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
        // TODO: Log close code and reason?

        const responsePayload = Buffer.alloc(2);
        responsePayload.writeUInt16BE(code !== WebsocketCloseCode.NoStatusRcvd ? WebsocketCloseCode.NormalClosure : code, 0);

        this.close(code !== WebsocketCloseCode.NoStatusRcvd ? WebsocketCloseCode.NormalClosure : code);
    }

    private processPingFrame({payload}: WebsocketDataFrame): void {
        // Send pong back with same payload
        this.outgoingDataBuffer.write(spawnFrameData(WebsocketDataFrameType.Pong, {payload}).render());
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
        const {pingTimeout, pingsInProgress, handleLostConnection, outgoingDataBuffer} = this;

        const payload = crypto.randomBytes(4);
        pingsInProgress.set(payload.toString("hex"), Date.now());

        console.log('>> ping', {pingsInProgress});
        this.connectivityErrorTimoutId = setTimeout(handleLostConnection, pingTimeout);

        outgoingDataBuffer.write(spawnFrameData(WebsocketDataFrameType.Ping, {payload}).render())
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
        this.close(WebsocketCloseCode.AbnormalClosure);
    };

    private readonly setState = (newState: ConnectionState) => {
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
    };
}
