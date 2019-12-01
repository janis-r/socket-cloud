import {Socket} from "net";
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
    private dataFrames = new Set<WebsocketDataFrame>();
    private incomingMessageQueue = new Set<Promise<void>>();
    private backpressureActive = false;
    private outgoingMessageQueue = new Array<Buffer>();

    constructor(readonly descriptor: WebsocketDescriptor,
                readonly context: ConfigurationContext,
                private readonly socket: Socket,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();

        socket.once("ready", () => this.setState(ConnectionState.OPEN));
        socket.on("data", this.incomingDataHandler);
        // socket.on("drain", );
        // socket.on("error", );
        socket.on("close", () => this.setState(ConnectionState.CLOSED));
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

    send(message: Buffer);
    send(message: string);
    async send(message: string | Buffer): Promise<void> {
        const {socket, extensions, outgoingMessageQueue} = this;
        const {TextFrame, BinaryFrame} = WebsocketDataFrameType;

        const [type, payload] = typeof message === "string" ?
            [TextFrame, Buffer.from(message)] :
            [BinaryFrame, message];

        let dataFrame = createDataFrame(type, {payload});

        if (extensions && extensions.length > 0) {
            for (const extension of extensions.filter(({transformOutgoingData}) => !!transformOutgoingData)) {
                const transformation = extension.transformOutgoingData(dataFrame);
                dataFrame = isPromise(transformation) ? await transformation : transformation;
            }
        }

        const binaryData = composeWebsocketFrame(dataFrame);

        if (this.backpressureActive) {
            this.outgoingMessageQueue.push(binaryData);
            return;
        }

        // If there is backpressure, write returns false and the you should wait for drain
        // to be emitted before writing additional data.
        const success = socket.write(binaryData, err => err && console.log('socket.write err', err));
        if (!success) {
            this.outgoingMessageQueue.push(binaryData);
            this.backpressureActive = true;
            socket.once("drain", this.resendData);
        }
    }

    private readonly resendData = () => {
        const {socket, outgoingMessageQueue} = this;
        while (outgoingMessageQueue.length > 0) {
            const success = socket.write(outgoingMessageQueue[0], err => err && console.log('socket.write err II', err));
            if (success) {
                outgoingMessageQueue.shift();
            } else {
                socket.once("drain", this.resendData);
                return;
            }
        }
        this.backpressureActive = false;
    };


    private readonly incomingDataHandler = async (data: Buffer) => {
        const {incomingMessageQueue: queue} = this;
        const processingPromise = new Promise<void>(async resolve => {
            await Promise.all([...queue]);
            await this.processIncomingDataFrame(data);
            resolve();
        });

        queue.add(processingPromise);
        await processingPromise;
        queue.delete(processingPromise);
    };

    private async processIncomingDataFrame(data: Buffer): Promise<void> {
        const {socket, dataFrames, extensions} = this;

        const id = Math.floor(Math.random() * 0xFFFF).toString(16);

        console.log(`\n>> [${id}] incomingDataHandler`, data.length, 'bytes,', data.toString("hex").substr(0, 50) + '...');

        let dataFrame: WebsocketDataFrame;
        try {
            dataFrame = decomposeWebSocketFrame(data);
            if (dataFrame.type === WebsocketDataFrameType.Ping) {
                process.exit();
            }

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

        const {type, isFinal, payload} = dataFrame;
        switch (type) {
            case WebsocketDataFrameType.Ping:
                socket.write(composeWebsocketFrame(
                    createDataFrame(WebsocketDataFrameType.Pong, {payload})
                ));
                break;
            case WebsocketDataFrameType.ConnectionClose:
                const closeCode = payload && payload.length > 0 ? parseInt(payload.toString("hex"), 16) : WebsocketCloseCode.NoStatusRcvd;
                console.log({closeCode});
                this.setState(ConnectionState.CLOSING);
                socket.end();
                break;
            case WebsocketDataFrameType.TextFrame:
            case WebsocketDataFrameType.BinaryFrame:
            case WebsocketDataFrameType.ContinuationFrame:
                dataFrames.add(dataFrame);
                if (isFinal) {
                    this.submitMessage();
                }
                break;
            case WebsocketDataFrameType.Pong:
                // TODO: Register pong?
                break;
            default:
                this.setState(ConnectionState.CLOSING);
                this.dispatchEvent(new ErrorEvent(this, `Unknown frame type (${type}) encountered in data frame: ${JSON.stringify(dataFrame)}`));
                socket.end("HTTP/1.1 400 Bad Request");
        }
    }

    private submitMessage() {
        const {dataFrames} = this;
        const messageBuffer = dataFrames.size === 1 ? [...dataFrames][0].payload : Buffer.concat([...dataFrames].map(({payload}) => payload));
        const message = messageBuffer.toString("utf8");
        console.log(message.substr(0, 100));
        this.dispatchEvent(new MessageEvent(this, message));

        this.send('Grāžķūnis!');

        /*const pingFrame = composeWebsocketFrame(createDataFrame(
            WebsocketDataFrameType.Ping
            // , {payload: Buffer.from("1234")}
        ));

        console.log(decomposeWebSocketFrame(pingFrame));
        // process.exit()
        this.send(pingFrame);*/
    }

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
