import {Socket} from "net";
import {Event} from "qft";
import {fragmentWebsocketFrame, spawnFrameData} from "../util/websocket-utils";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {frameTypeToString, WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
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
import {WebsocketIncomingDataBuffer} from "./helper/WebsocketIncomingDataBuffer";
import {WebsocketOutgoingDataBuffer} from "./helper/WebsocketOutgoingDataBuffer";
import {KeepAliveManager} from "./clientExtensions/KeepAliveManager";
import {IncomingDataManager} from "./clientExtensions/IncomingDataManager";
import chalk from "chalk";

const isValidUTF8: (data: Buffer) => boolean = require('utf-8-validate');

export const debug = false;

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private _state = ConnectionState.Connecting;

    private readonly incomingDataBuffer = new WebsocketIncomingDataBuffer();
    private readonly outgoingDataBuffer: WebsocketOutgoingDataBuffer;

    private readonly incomingMessageQueue = new Set<Promise<any>>();

    private readonly incomingDataExtensions: Array<WebsocketExtensionAgent>;
    private readonly outgoingDataExtensions: Array<WebsocketExtensionAgent>;

    private readonly keepAliveManager: KeepAliveManager;
    private readonly incomingDataManager: IncomingDataManager;

    constructor(private readonly socket: Socket,
                readonly descriptor: WebsocketDescriptor,
                readonly context: ConfigurationContext,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();
        debug && console.log({descriptor, context});

        this.keepAliveManager = new KeepAliveManager(this);
        this.outgoingDataBuffer = new WebsocketOutgoingDataBuffer(socket);
        this.incomingDataManager = new IncomingDataManager(this);

        const {incomingDataBuffer, incomingDataManager, rawDataHandler, parsedDataHandler} = this;
        socket.on("data", data => incomingDataBuffer.write(data));

        incomingDataBuffer.addEventListener("data", ({data}) => rawDataHandler(data));
        incomingDataManager.addEventListener("data", ({data}) => parsedDataHandler(data));

        socket.once("error", err => {
            console.log(`WebsocketClientConnection socket err: ${JSON.stringify(err.message)}`);
            this.dispatchEvent(new ErrorEvent(this, err.message));
            this.close(WebsocketCloseCode.AbnormalClosure, err.message);
        });
        socket.on("close", () => this.setState(ConnectionState.Closed));

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

        // TODO: Do I really don't have any event from Socket that it's ready?
        this.setState(ConnectionState.Open);
    }

    get state(): ConnectionState {
        return this._state;
    }

    async close(code: WebsocketCloseCode = WebsocketCloseCode.NormalClosure, reason?: string): Promise<boolean> {
        const {state, socket} = this;
        console.log('>> close', {code, reason});
        if (state >= ConnectionState.Closing) {
            return false;
        }
        const payload = Buffer.alloc(2);
        payload.writeUInt16BE(code, 0);
        this.setState(ConnectionState.Closing);

        await this.sendDataFrame(spawnFrameData(WebsocketDataFrameType.ConnectionClose, {payload}));
        socket.end();
        return true;
    }

    send(data: Buffer);
    send(data: string);
    async send(data: string | Buffer): Promise<void> {
        debug && console.log(chalk.red('>> send', data.length.toString(), 'bytes'), typeof data === "string" ? data.substr(0, 100) : data);
        await this.sendDataFrame(this.prepareDataFrame(data));
        // process.exit();
    }

    async sendDataFrame(data: WebsocketDataFrame | WebsocketDataFrame[] | Promise<WebsocketDataFrame | WebsocketDataFrame[]>): Promise<void> {
        await this.outgoingDataBuffer.write(data);
    }

    private async prepareDataFrame(data: string | Buffer): Promise<WebsocketDataFrame[]> {
        const {TextFrame, BinaryFrame} = WebsocketDataFrameType;
        const {context: {outgoingMessageFragmentSize: fragmentSize}} = this;

        const [type, payload] = typeof data === "string" ? [TextFrame, Buffer.from(data)] : [BinaryFrame, data];
        return this.extendOutgoingData(fragmentWebsocketFrame(type, payload, fragmentSize));
    }

    private readonly rawDataHandler = async (dataFrame: WebsocketDataFrame) => {
        const {ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong} = WebsocketDataFrameType;
        if (![ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong].includes(dataFrame.type)) {
            this.close(WebsocketCloseCode.ProtocolError, `Unknown frame type ${dataFrame.type} received`);
            return;
        }

        this.dispatchEvent("data-frame", dataFrame);
        switch (dataFrame.type) {
            case ConnectionClose:
                this.processConnectionCloseFrame(dataFrame);
                break;
            case Ping:
                await this.processPingFrame(dataFrame);
                break;
        }
    };

    private readonly parsedDataHandler = async (data: WebsocketDataFrame) => {
        const {incomingMessageQueue: queue} = this;
        const extendedFrame = new Promise<WebsocketDataFrame>(async resolve => {
            await Promise.all([...queue]);
            // This would apply all the extension updates to incoming data frame
            debug && console.log(chalk.red('>> unextended data', data.payload.length.toString(), 'bytes'), data);
            const [extendedData] = await this.extendIncomingData([data]);
            debug && console.log(chalk.red('>> extended data', extendedData.payload.length.toString(), 'bytes'), extendedData);
            resolve(extendedData);
        });

        queue.add(extendedFrame);
        const dataFrame = await extendedFrame;
        queue.delete(extendedFrame);

        const {type, payload, rsv1, rsv2, rsv3} = dataFrame;

        if ([rsv1, rsv2, rsv3].includes(true)) {
            this.close(WebsocketCloseCode.ProtocolError, `Some RSV fields have not being reset by extensions ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (type === WebsocketDataFrameType.TextFrame && !isValidUTF8(payload)) {
            this.close(WebsocketCloseCode.InvalidFramePayloadData, `Received invalid UTF8 content 1: ${JSON.stringify({
                ...dataFrame,
                payload: dataFrame.payload.toString("utf8")
            })}`);
            return;
        }

        let event: Event;
        if (type === WebsocketDataFrameType.TextFrame) {
            event = new MessageEvent(this, payload.toString("utf8"));
        } else {
            event = new DataEvent(this, payload);
        }

        debug && console.log(`>> ${frameTypeToString(type)} message`, type, payload.length, 'bytes');
        debug && type == WebsocketDataFrameType.TextFrame && console.log(`>> ${frameTypeToString(type)} message`, payload.toString("utf8").substr(0, 20));

        this.dispatchEvent(event);
    };

    private processConnectionCloseFrame({payload}: WebsocketDataFrame): void {
        const {ProtocolError, AbnormalClosure, NormalClosure, NoStatusRcvd} = WebsocketCloseCode;

        if (this.state >= ConnectionState.Closing) {
            // We're already in closed state. No need to respond.
            return;
        }

        if (payload.length === 1) {
            this.dispatchEvent(new ErrorEvent(this, `Close connection frame with length 1 byte received`));
            this.close(ProtocolError);
            return;
        }

        if (payload.length > 2 && !isValidUTF8(payload.slice(2))) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload contain invalid UTF: ${payload.length}`));
            this.close(ProtocolError);
            return;
        }

        if (payload.length > 125) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload too long: ${payload.length}`));
            this.close(ProtocolError);
            return;
        }

        const code = payload.length >= 2 ? payload.readUInt16BE(0) : null;
        const reason = payload.length > 2 ? payload.slice(2).toString("utf8") : null;

        console.log({code, reason});

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
        if (this._state >= ConnectionState.Closing) {
            return;
        }
        const {outgoingDataBuffer} = this;
        if (payload.length > 125) {
            this.close(WebsocketCloseCode.ProtocolError, `Ping payload exceed 125 byte limit`);
            return;
        }
        await outgoingDataBuffer.write(spawnFrameData(WebsocketDataFrameType.Pong, {payload}));
    }


    private setState(newState: ConnectionState) {
        const {state: currentState} = this;
        console.log('>> setState', {
            currentState: connectionStateToString(currentState),
            newState: connectionStateToString(newState)
        });
        if (newState <= currentState) {
            throw new Error(`Error while transitioning ws connection state: ${{currentState, newState}}`);
        }

        this._state = newState;
        this.dispatchEvent(new StateChangeEvent(this, currentState));

        if (newState === ConnectionState.Closed) {
            this.incomingDataBuffer.destroy();
        }
    }

    private async extendIncomingData(data: WebsocketDataFrame[]): Promise<WebsocketDataFrame[]> {
        const {incomingDataExtensions} = this;
        if (!incomingDataExtensions) {
            return data;
        }
        for (const extension of incomingDataExtensions) {
            try {
                const transformation = extension.transformIncomingData(data);
                data = isPromise(transformation) ? await transformation : transformation;
            } catch (e) {
                this.close(WebsocketCloseCode.ProtocolError, e.message);
            }
        }
        return data;
    }

    private async extendOutgoingData(data: WebsocketDataFrame[]): Promise<WebsocketDataFrame[]> {
        debug && console.log('>> extendOutgoingData', data)
        const {outgoingDataExtensions} = this;
        if (!outgoingDataExtensions) {
            return data;
        }
        for (const extension of outgoingDataExtensions) {
            const transformation = extension.transformOutgoingData(data);
            data = isPromise(transformation) ? await transformation : transformation;
        }
        debug && console.log('>> extended', data)
        return data;
    }
}
