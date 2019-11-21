import {Socket} from "net";
import {EventDispatcher} from "qft";
import {decomposeWebSocketFrame} from "../util/websocket-utils";
import {ConnectionCloseEvent} from "../event/ConnectionCloseEvent";
import {ConnectionErrorEvent} from "../event/ConnectionErrorEvent";
import {ClientMessageEvent} from "../event/ClientMessageEvent";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {frameTypeToString, WebsocketDataFrameType} from "../data/WebsocketDataFrameType";

export class ClientConnection extends EventDispatcher {

    private _closed = false;
    private dataFrames = new Set<WebsocketDataFrame>();

    constructor(private readonly socket: Socket) {
        super();
        socket.addListener("data", this.incomingDataHandler);
    }

    get closed(): boolean {
        return this._closed;
    }

    // If there is backpressure, write returns false and the you should wait for drain
    // to be emitted before writing additional data.

    private readonly incomingDataHandler = (data: Buffer): void => {
        const {socket, dataFrames, dispatchEvent} = this;

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
            console.log('>> getPayload', message.payload.toString('utf8'));

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
                dispatchEvent(new ConnectionCloseEvent(this));
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
                dispatchEvent(new ConnectionErrorEvent(this, msg));
                dispatchEvent(new ConnectionCloseEvent(this, msg));
        }
    };

    private submitMessage() {
        const {dataFrames, dispatchEvent} = this;
        dispatchEvent(new ClientMessageEvent(this, [...dataFrames].map(({payload}) => payload).join('')));
    }

}


