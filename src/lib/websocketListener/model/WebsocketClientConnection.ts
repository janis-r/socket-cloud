import {Socket} from "net";
import {fragmentWebsocketFrame, spawnFrameData} from "../util/websocket-utils";
import {DataFrame} from "../data/DataFrame";
import {DataFrameType} from "../data/DataFrameType";
import {isPromise} from "../../utils/is-promise";
import {ClientConnection, ConnectionState, connectionStateToString} from "../../clientConnectionPool";
import {ErrorEvent, MessageEvent, StateChangeEvent} from "../../clientConnectionPool/connectionEvent";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {ConfigurationContext} from "../../configurationContext";
import {CloseCode, isValidWebsocketCloseCode} from "../data/CloseCode";
import {WebsocketDescriptor} from "../data/SocketDescriptor";
import {ClientConnectionEventBase} from "./ClientConnectionEventBase";
import {OutgoingMessageBuffer} from "./helper/OutgoingMessageBuffer";
import {KeepAliveManager} from "./clientExtensions/KeepAliveManager";
import {IncomingMessageBuffer} from "./helper/IncomingMessageBuffer";
import {ExecutionQueue} from "ugd10a";
import chalk from "chalk";

const isValidUTF8: (data: Buffer) => boolean = require('utf-8-validate');

export const debug = false;

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private _state = ConnectionState.Connecting;

    private readonly incomingMessageManager: IncomingMessageBuffer;
    private readonly outgoingDataBuffer: OutgoingMessageBuffer;

    private readonly outgoingMessagePreparationQueue = new ExecutionQueue();
    private readonly incomingMessageExtendingQueue = new ExecutionQueue();

    private readonly incomingDataExtensions: Array<WebsocketExtensionAgent>;
    private readonly outgoingDataExtensions: Array<WebsocketExtensionAgent>;

    private readonly keepAliveManager: KeepAliveManager;

    constructor(private readonly socket: Socket,
                readonly descriptor: WebsocketDescriptor,
                readonly context: ConfigurationContext,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        super();
        debug && console.log({descriptor, context});

        this.keepAliveManager = new KeepAliveManager(this);
        this.incomingMessageManager = new IncomingMessageBuffer();
        this.outgoingDataBuffer = new OutgoingMessageBuffer(socket);

        const {incomingMessageManager, parsedDataHandler} = this;

        incomingMessageManager.onData(parsedDataHandler);
        incomingMessageManager.onError(error => {
            this.dispatchEvent(new ErrorEvent(this, error));
            this.close(CloseCode.ProtocolError, error, true);
        });

        socket.on("data", incomingMessageManager.write);
        socket.once("error", this.socketErrorHandler);
        socket.on("close", this.socketCloseHandler);

        if (extensions && extensions.length > 0) {
            const incoming = [];
            const outgoing = [];
            extensions.forEach(extension => {
                if (extension.transformIncomingData) {
                    incoming.push(extension);
                }
                if (extension.transformOutgoingData) {
                    outgoing.push(extension);
                }
            });

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

    async close(code: CloseCode = CloseCode.NormalClosure, reason?: string, immediate?: boolean): Promise<boolean> {
        const {state, socket} = this;
        console.log('>> close', {code, reason, immediate});
        if (state >= ConnectionState.Closing) {
            return false;
        }

        let payload = Buffer.alloc(2);
        payload.writeUInt16BE(code, 0);
        if (reason) {
            payload = Buffer.concat([payload, Buffer.from(reason)]);
        }

        if (immediate) {
            this.setState(ConnectionState.Closing);
            socket.end();
            return true;
        }

        const closeMessageSent = this.sendDataFrame(spawnFrameData(DataFrameType.ConnectionClose, {payload}));
        this.setState(ConnectionState.Closing);
        await closeMessageSent;
        socket.end();
        return true;
    }

    send(data: Buffer): Promise<void>;
    send(data: string): Promise<void>;
    async send(data: string | Buffer): Promise<void> {
        const {outgoingMessagePreparationQueue: {enqueue}} = this;
        await enqueue(() => this.sendDataFrame(this.prepareDataFrame(data)));
    }

    async sendDataFrame(data: DataFrame | DataFrame[] | Promise<DataFrame | DataFrame[]>): Promise<void> {
        if (this._state >= ConnectionState.Closing) {
            return;
        }
        await this.outgoingDataBuffer.write(data);
    }

    private async prepareDataFrame(data: string | Buffer): Promise<DataFrame[]> {
        const {TextFrame, BinaryFrame} = DataFrameType;
        const {context: {outgoingMessageFragmentSize: fragmentSize}} = this;

        const [type, payload] = typeof data === "string" ? [TextFrame, Buffer.from(data)] : [BinaryFrame, data];
        const extendedFrame = await this.extendOutgoingData(spawnFrameData(type, {payload}));
        return fragmentWebsocketFrame(extendedFrame, fragmentSize);
    }

    private readonly parsedDataHandler = async (data: DataFrame) => {
        const {ProtocolError, InvalidFramePayloadData} = CloseCode;
        const {TextFrame, ConnectionClose, Ping, Pong, BinaryFrame} = DataFrameType;
        const {incomingMessageExtendingQueue: {enqueue}} = this;
        debug && console.log('>> parsedDataHandler', chalk.red(connectionStateToString(this._state)), data);

        const dataFrame = await enqueue(() => this.extendIncomingData(data));
        const {type, payload, rsv1, rsv2, rsv3} = dataFrame;

        if (this._state >= ConnectionState.Closing && type !== ConnectionClose) {
            debug && console.log('>> parsedDataHandler', chalk.red('stop'));
            return;
        }

        if ([rsv1, rsv2, rsv3].includes(true)) {
            this.close(ProtocolError, `Some RSV fields have not being reset by extensions: ${JSON.stringify(dataFrame)}`, true);
            return;
        }

        if (type === TextFrame && !isValidUTF8(payload)) {
            this.close(InvalidFramePayloadData, `Received invalid UTF8 content: ${JSON.stringify(dataFrame)}`, true);
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
            case Pong:
                break;
            case TextFrame:
            case BinaryFrame:
                this.dispatchEvent(new MessageEvent(this, type === TextFrame ? payload.toString("utf8") : payload));
                break;
            default:
                console.log('wtf?', dataFrame);
        }

    };

    private processConnectionCloseFrame({payload}: DataFrame): void {
        const {ProtocolError, AbnormalClosure, NormalClosure, NoStatusRcvd} = CloseCode;

        if (this.state >= ConnectionState.Closing) {
            // We're already in closed state. No need to respond.
            return;
        }

        if (payload.length === 1) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload too short (1 byte)`));
            this.close(ProtocolError, `Close frame payload too short (1 byte)`);
            return;
        }

        if (payload.length > 2 && !isValidUTF8(payload.slice(2))) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload contain invalid UTF: ${payload.length}`));
            this.close(ProtocolError, `Close frame payload contain invalid UTF`);
            return;
        }

        if (payload.length > 125) {
            this.dispatchEvent(new ErrorEvent(this, `Close frame payload too long: ${payload.length}`));
            this.close(ProtocolError, `Close frame payload too long`);
            return;
        }

        const code = payload.length >= 2 ? payload.readUInt16BE(0) : null;
        const reason = payload.length > 2 ? payload.slice(2).toString("utf8") : null;

        console.log('>> processConnectionCloseFrame', {code, reason});

        // NoStatusRcvd & AbnormalClosure are not allowed to appear in data requests
        if (code !== null && ([NoStatusRcvd, AbnormalClosure].includes(code) || !isValidWebsocketCloseCode(code))) {
            this.dispatchEvent(new ErrorEvent(this, `Invalid close code received: ${{code}}`));
            this.close(ProtocolError, `Invalid close code received`);
            return;
        }

        // TODO: Log close code and reason?
        this.close(code ?? NormalClosure);
    }

    private async processPingFrame({payload}: DataFrame): Promise<void> {
        if (this._state >= ConnectionState.Closing) {
            return;
        }
        const {outgoingDataBuffer} = this;
        if (payload.length > 125) {
            this.close(CloseCode.ProtocolError, `Ping payload exceed 125 byte limit`);
            return;
        }
        await outgoingDataBuffer.write(spawnFrameData(DataFrameType.Pong, {payload}));
    }

    private setState(newState: ConnectionState) {
        const {state: currentState} = this;
        console.log('>> setState', {
            currentState: connectionStateToString(currentState),
            newState: connectionStateToString(newState)
        });
        if (newState <= currentState) {
            throw new Error(`Error while transitioning ws connection state - currentState: ${connectionStateToString(currentState)}, newState: ${connectionStateToString(newState)}`);
        }

        this._state = newState;
        this.dispatchEvent(new StateChangeEvent(this, currentState));
    }

    private async extendIncomingData(data: DataFrame): Promise<DataFrame> {
        const {incomingDataExtensions} = this;
        if (!incomingDataExtensions) {
            return data;
        }

        for (const extension of incomingDataExtensions) {
            try {
                const transformation = extension.transformIncomingData(data);
                data = isPromise(transformation) ? await transformation : transformation;
            } catch (e) {
                this.close(CloseCode.ProtocolError, e.message);
            }
        }
        return data;
    }

    private async extendOutgoingData(data: DataFrame): Promise<DataFrame> {
        const {outgoingDataExtensions} = this;
        if (!outgoingDataExtensions) {
            return data;
        }
        for (const extension of outgoingDataExtensions) {
            const transformation = extension.transformOutgoingData(data);
            data = isPromise(transformation) ? await transformation : transformation;
        }
        return data;
    }

    private readonly socketErrorHandler = (err: Error) => {
        console.log(`WebsocketClientConnection socket err: ${JSON.stringify(err.message)}`);
        this.dispatchEvent(new ErrorEvent(this, err.message));
        this.close(CloseCode.AbnormalClosure, err.message);
    };

    private readonly socketCloseHandler = () => {
        this.setState(ConnectionState.Closed);
        this.incomingMessageManager.destroy();
    }
}
