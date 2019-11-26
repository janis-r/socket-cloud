import {Socket} from "net";
import {EventDispatcher, EventListener} from "qft";
import {decomposeWebSocketFrame} from "../util/websocket-utils";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
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
        switch (event) {
            case "message" :
                return super.addEventListener(ClientMessageEvent.TYPE, listener, scope);
            case "close" :
                return super.addEventListener(ConnectionCloseEvent.TYPE, listener, scope);
            case "error" :
                return super.addEventListener(ConnectionErrorEvent.TYPE, listener, scope);
            default:
                return super.addEventListener(event, listener, scope);
        }
    }

    // If there is backpressure, write returns false and the you should wait for drain
    // to be emitted before writing additional data.

    private readonly incomingDataHandler = async (data: Buffer) => {
        const {socket, dataFrames, extensions} = this;

        console.log('>> incomingDataHandler', data.length, 'bytes');

        let message: WebsocketDataFrame;
        try {
            message = decomposeWebSocketFrame(data);
        } catch (e) {
            console.log('>> e1', e);
            process.exit();
            return;
        }

        const {type, isFinal} = message.header;
        try {
            console.log('>> type', frameTypeToString(type));
            console.log('>> header', message.header);
            console.log('>> raw payload', message.payload.toString('utf8'));
            console.log('>> extensions', extensions);

            let payload = message.payload;
            if (extensions && extensions.length > 0) {
                for (const extension of extensions) {
                    if (!extension.transformIncomingData) {
                        continue;
                    }

                    const transformation = extension.transformIncomingData(payload);
                    payload = isPromise(transformation) ? await transformation : transformation;
                }
            }
            console.log('>> payload', payload);
            process.exit();
        } catch (e) {
            console.log('>> e2', e);
            process.exit();
            return;
        }
        switch (type) {
            case WebsocketDataFrameType.Ping:
                // TODO: respond with pong
                break;
            case WebsocketDataFrameType.ConnectionClose:
                this._closed = true;
                socket.end();
                this.dispatchEvent(new ConnectionCloseEvent(this));
                break;
            case WebsocketDataFrameType.TextFrame:
            case WebsocketDataFrameType.BinaryFrame:
            case WebsocketDataFrameType.ContinuationFrame:
                dataFrames.add(message);
                if (isFinal) {
                    this.submitMessage();
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
        this.dispatchEvent(new ClientMessageEvent(this, [...dataFrames].map(({payload}) => payload).join('')));
    }

}


