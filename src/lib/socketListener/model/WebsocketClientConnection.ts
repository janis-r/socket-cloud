import {Socket} from "net";
import {EventDispatcher, EventListener, referenceToString} from "qft";
import {composeWebsocketFrame, decomposeWebSocketFrame} from "../util/websocket-utils";
import {createDataFrame, WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {frameTypeToString, WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
import {isPromise} from "../util/is-promise";
import {ClientConnection, ClientMessageEvent, ConnectionCloseEvent, ConnectionErrorEvent} from "../../socketServer";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {ConfigurationContext} from "../../configurationContext";

export class WebsocketClientConnection extends EventDispatcher implements ClientConnection {

    readonly remoteAddress: string;

    private _closed = false;
    private dataFrames = new Set<WebsocketDataFrame>();

    constructor(private readonly socket: Socket,
                private readonly context: ConfigurationContext,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();
        this.remoteAddress = socket.remoteAddress;

        socket.addListener("data", this.incomingDataHandler);
    }

    get closed(): boolean {
        return this._closed;
    }

    addEventListener(event: "close", listener: EventListener<ConnectionCloseEvent>, scope?: Object);
    addEventListener(event: "message", listener: EventListener<ClientMessageEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ConnectionErrorEvent>, scope?: Object);
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object) {
        return super.addEventListener(eventNameProxy(event), listener, scope);
    }

    removeEventListener(event: "close", listener: EventListener<ConnectionCloseEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<ClientMessageEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ConnectionErrorEvent>, scope?: Object);
    removeEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): boolean {
        return super.removeEventListener(eventNameProxy(event), listener, scope);
    }

    write(message: Buffer);
    write(message: string);
    async write(message: string | Buffer): Promise<void> {
        const {socket, extensions} = this;
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

        socket.write(composeWebsocketFrame(dataFrame));
    }

    // If there is backpressure, write returns false and the you should wait for drain
    // to be emitted before writing additional data.

    private readonly incomingDataHandler = async (data: Buffer) => {
        const {socket, dataFrames, extensions} = this;

        console.log('>> incomingDataHandler', data.length, 'bytes');

        let dataFrame: WebsocketDataFrame;
        try {
            dataFrame = decomposeWebSocketFrame(data);
            console.log('>> type', {type: frameTypeToString(dataFrame.type), isFinal: dataFrame.isFinal});
            console.log('>> extensions', extensions ? extensions.map(e => referenceToString(e.constructor)) : null);
            if (extensions && extensions.length > 0) {
                for (const extension of extensions.filter(({transformIncomingData}) => !!transformIncomingData)) {
                    const transformation = extension.transformIncomingData(dataFrame);
                    dataFrame = isPromise(transformation) ? await transformation : transformation;
                }
            }
            console.log('>> payload', dataFrame.payload.toString("utf8"));
            process.exit();
        } catch (e) {
            console.log('>> e@decomposeWebSocketFrame', e.message);
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
                this._closed = true;
                socket.end();
                this.dispatchEvent(new ConnectionCloseEvent(this));
                break;
            case WebsocketDataFrameType.TextFrame:
            case WebsocketDataFrameType.BinaryFrame:
            case WebsocketDataFrameType.ContinuationFrame:
                dataFrames.add(dataFrame);
                if (isFinal) {
                    this.submitMessage();
                    this.write('Grāžķūnis!')
                }
                break;
            case WebsocketDataFrameType.Pong:
                // TODO: Register pong?
                break;
            default:
                this._closed = true;
                socket.end("HTTP/1.1 400 Bad Request");
                const msg = `Unknown frame type (${type}) encountered`;
                this.dispatchEvent(new ConnectionErrorEvent(this, msg));
                this.dispatchEvent(new ConnectionCloseEvent(this, msg));
        }
    };

    private submitMessage() {
        const {dataFrames} = this;

        const messageBuffer = dataFrames.size === 1 ? [...dataFrames][0].payload : Buffer.concat([...dataFrames].map(({payload}) => payload));
        this.dispatchEvent(new ClientMessageEvent(
            this,
            messageBuffer.toString("utf8")
        ));
    }

}

const eventNameProxy = (event: string | Symbol): string | Symbol => {
    switch (event) {
        case "message" :
            return ClientMessageEvent.TYPE;
        case "close" :
            return ConnectionCloseEvent.TYPE;
        case "error" :
            return ConnectionErrorEvent.TYPE;
        default:
            return event;
    }
};
