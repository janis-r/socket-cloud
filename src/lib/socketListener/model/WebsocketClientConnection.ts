import {Socket} from "net";
import * as crypto from "crypto";
import {composeWebsocketFrame, fragmentWebsocketFrame, spawnFrameData} from "../util/websocket-utils";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
import {isPromise} from "../../utils/is-promise";
import {
    ClientConnection,
    ConnectionState,
    connectionStateToString,
    DataEvent,
    ErrorEvent,
    MessageEvent,
    StateChangeEvent
} from "../../socketServer";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {ConfigurationContext} from "../../configurationContext";
import {isValidWebsocketCloseCode, WebsocketCloseCode} from "../data/WebsocketCloseCode";
import {WebsocketDescriptor} from "../data/SocketDescriptor";
import {ClientConnectionEventBase} from "./ClientConnectionEventBase";
import {WebsocketIncomingDataBuffer} from "../util/WebsocketIncomingDataBuffer";
import {WebsocketOutgoingDataBuffer} from "../util/WebsocketOutgoingDataBuffer";
import {valueBelongsToEnum} from "ugd10a";

const isValidUTF8: (data: Buffer) => boolean = require('utf-8-validate');

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private _state = ConnectionState.CONNECTING;
    private readonly incomingDataBuffer = new WebsocketIncomingDataBuffer();
    private readonly outgoingDataBuffer: WebsocketOutgoingDataBuffer;

    private readonly dataFrames = new Set<WebsocketDataFrame>();
    private readonly incomingMessageQueue = new Set<Promise<any>>();
    private readonly outgoingMessageProcessingQueue = new Set<Promise<any>>();

    private readonly pingTimeout: number;
    private readonly pingsInProgress = new Map<string, number>();
    private nextPingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private connectivityErrorTimoutId: ReturnType<typeof setTimeout> | null = null;

    private readonly incomingDataExtensions: Array<WebsocketExtensionAgent>;
    private readonly outgoingDataExtensions: Array<WebsocketExtensionAgent>;

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

        if (extensions && extensions.length > 0) {
            const incoming = extensions.filter(({transformIncomingData}) => !!transformIncomingData);
            const outgoing = extensions.filter(({transformOutgoingData}) => !!transformOutgoingData);
            if (incoming) {
                this.incomingDataExtensions = incoming;
            }
            if (outgoing) {
                this.outgoingDataExtensions = outgoing;
            }
        }

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
        console.log('>> close', code);
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
        console.log('>> incomingDataHandler', data);
        const {incomingMessageQueue: queue} = this;
        const process = new Promise<boolean>(async resolve => {
            if (queue.size > 0) {
                await Promise.all([...queue]);
            }

            if (!data.isFinal) {
                const cantBeFragmented = [
                    WebsocketDataFrameType.TextFrame,
                    WebsocketDataFrameType.BinaryFrame,
                    WebsocketDataFrameType.ContinuationFrame
                ].includes(data.type);

                if (!cantBeFragmented) {
                    const event = new ErrorEvent(this, `Received fragmented message that should never be fragmented ${JSON.stringify(data)}`);
                    console.log(event.message);
                    this.dispatchEvent(event);
                    this.close(WebsocketCloseCode.ProtocolError);
                    resolve(false);
                    return;
                }
            }

            // This would apply all the extension updates to incoming data frame
            const [extendedData] = (await this.extendIncomingData([data]));
            // And here all rsv fields must be already set to 0 as extensions have been applied
            if (extendedData.rsv1 || extendedData.rsv2 || extendedData.rsv3) {
                console.log('Some RSV fields have not being reset by extensions - protocol error @incomingDataHandler');
                this.close(WebsocketCloseCode.ProtocolError);
                resolve(false);
                return;
            }

            await this.processIncomingDataFrame(extendedData);
            resolve(true);
        });

        queue.add(process);
        if (await process === false) {
            return;
        }
        queue.delete(process);
    };

    private async extendIncomingData(data: WebsocketDataFrame[]): Promise<WebsocketDataFrame[]> {
        const {incomingDataExtensions} = this;
        if (!incomingDataExtensions) {
            return data;
        }

        for (const extension of incomingDataExtensions) {
            const transformation = extension.transformIncomingData(data);
            data = isPromise(transformation) ? await transformation : transformation;
        }

        return data;
    }

    private async processIncomingDataFrame(dataFrame: WebsocketDataFrame): Promise<void> {
        console.log('>> processIncomingDataFrame', dataFrame);
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
                await this.processPingFrame(dataFrame);
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
        const {dataFrames} = this;

        if (dataFrame.type === WebsocketDataFrameType.ContinuationFrame && dataFrames.size === 0) {
            this.dispatchEvent(new ErrorEvent(this, `Received continuation frame with not preceding opening frame: ${JSON.stringify(dataFrame)}`));
            this.close(WebsocketCloseCode.ProtocolError);
            return;
        }
        if (dataFrame.type !== WebsocketDataFrameType.ContinuationFrame && dataFrames.size > 0) {
            this.dispatchEvent(new ErrorEvent(this, `Received double opening frames: ${JSON.stringify(dataFrame)}`));
            this.close(WebsocketCloseCode.ProtocolError);
            return;
        }


        dataFrames.add(dataFrame);
        if (!dataFrame.isFinal) {
            return;
        }

        let frames = [...dataFrames];
        dataFrames.clear();

        const message = frames.length === 1 ? frames[0].payload : Buffer.concat(frames.map(({payload}) => payload));
        const isTextData = frames[0].type === WebsocketDataFrameType.TextFrame;
        if (isTextData) {
            if (!isValidUTF8(message)) {
                this.dispatchEvent(new ErrorEvent(this, `Received invalid UTF8 content: ${JSON.stringify(message)}`));
                this.close(WebsocketCloseCode.ProtocolError);
                return;
            }

            const event = new MessageEvent(this, message.toString("utf8"));
            console.log('>> text message', event.message.substr(0, 100));
            this.dispatchEvent(event);
        } else {
            console.log('>> binary message', message);
            this.dispatchEvent(new DataEvent(this, message));
        }
        // this.send(["a", "b"/*, "c"*/].map(char => new Array(10).fill(null).map((v, i) => char + i).join("")).join('-'));
    }

    private processConnectionCloseFrame({payload}: WebsocketDataFrame): void {
        const {ProtocolError, AbnormalClosure, NormalClosure, NoStatusRcvd} = WebsocketCloseCode;

        if (payload.length === 1) {
            this.dispatchEvent(new ErrorEvent(this, `Close connection frame with length 1 byte received`));
            this.close(ProtocolError);
            return;
        }

        if (payload.length > 125) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload too long: ${payload.length}`));
            this.close(ProtocolError);
            return;
        }

        if (payload.length > 2 && !isValidUTF8(payload.slice(2))) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload contain invalid UTF too long: ${payload.length}`));
            this.close(ProtocolError);
            return;
        }

        const code = payload.length >= 2 ? payload.readUInt16BE(0) : null;
        const reason = payload.length > 2 ? payload.slice(2).toString("utf8") : null;

        console.log({code, reason})

        // NoStatusRcvd & AbnormalClosure are not allowed to appear in data requests
        if (code !== null && ([NoStatusRcvd, AbnormalClosure].includes(code) || !isValidWebsocketCloseCode(code))) {
            this.dispatchEvent(new ErrorEvent(this, `Invalid close code received: ${{code}}`));
            this.close(ProtocolError);
            return;
        }

        console.log('>> processConnectionCloseFrame', {payload, code, reason});

        // TODO: Log close code and reason?

        this.close(code ?? NormalClosure);
    }

    private async processPingFrame({payload}: WebsocketDataFrame): Promise<void> {
        const {outgoingDataBuffer} = this;
        if (payload.length > 125) {
            this.close(WebsocketCloseCode.ProtocolError);
            return;
        }
        await outgoingDataBuffer.write(spawnFrameData(WebsocketDataFrameType.Pong, {payload}).render());
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
