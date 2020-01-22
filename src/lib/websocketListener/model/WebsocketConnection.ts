import {Socket} from "net";
import {spawnFrameData} from "../util/websocket-utils";
import {DataFrame} from "../data/DataFrame";
import {DataFrameType} from "../data/DataFrameType";
import {ConnectionState, connectionStateToString} from "../../clientConnectionPool";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {ConfigurationContext} from "../../configurationContext";
import {CloseCode, isValidWebsocketCloseCode} from "../data/CloseCode";
import {OutgoingMessageBuffer} from "./helper/OutgoingMessageBuffer";
import {KeepAliveManager} from "./clientExtensions/KeepAliveManager";
import {IncomingMessageBuffer} from "./helper/IncomingMessageBuffer";
import chalk from "chalk";
import {isValidUTF8} from "../util/isValidUTF8";
import {CallbackCollection} from "../../utils/CallbackCollection";

export const debug = false;

export class WebsocketConnection {
    private _state = ConnectionState.Connecting;

    private readonly keepAliveManager: KeepAliveManager;
    private readonly incomingMessageBuffer: IncomingMessageBuffer;
    private readonly outgoingMessageBuffer: OutgoingMessageBuffer;

    private readonly errorCallback = new CallbackCollection<{ message: string, code?: any }>();
    private readonly dataCallback = new CallbackCollection<DataFrame>();
    private readonly messageCallback = new CallbackCollection<string | Buffer>();
    private readonly stateChangeCallback = new CallbackCollection<{ state: ConnectionState, prevState: ConnectionState }>();

    readonly onError = this.errorCallback.polymorph;
    readonly onData = this.dataCallback.polymorph;
    readonly onMessage = this.messageCallback.polymorph;
    readonly onStateChange = this.stateChangeCallback.polymorph;

    constructor(private readonly socket: Socket,
                readonly context: ConfigurationContext,
                private readonly extensions?: ReadonlyArray<WebsocketExtensionAgent>) {
        debug && console.log({context});

        this.keepAliveManager = new KeepAliveManager(this);
        this.incomingMessageBuffer = new IncomingMessageBuffer(extensions?.filter(({incomingDataPipe: pipe}) => !!pipe) || []);
        this.outgoingMessageBuffer = new OutgoingMessageBuffer(
            socket,
            extensions?.filter(({outgoingDataPipe: pipe}) => !!pipe) || [],
            context.outgoingMessageFragmentSize
        );

        const {incomingMessageBuffer, parsedDataHandler} = this;

        incomingMessageBuffer.onData(parsedDataHandler);
        incomingMessageBuffer.onError(({code, message}) => this.close(code, message, code !== CloseCode.InternalServerError));

        socket.on("data", incomingMessageBuffer.write);
        socket.once("error", this.socketErrorHandler);
        socket.on("close", this.socketCloseHandler);

        this.setState(ConnectionState.Open);
    }

    get state(): ConnectionState {
        return this._state;
    }

    async close(code: CloseCode = CloseCode.NormalClosure, message?: string, immediate?: boolean): Promise<boolean> {
        const {state, socket} = this;
        debug && console.log('>> close', {code, reason: message, immediate});
        if (state >= ConnectionState.Closing) {
            return false;
        }

        let payload = Buffer.alloc(2);
        payload.writeUInt16BE(code, 0);
        if (message) {
            payload = Buffer.concat([payload, Buffer.from(message)]);
            this.errorCallback.execute({message, code})
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
        const {TextFrame, BinaryFrame} = DataFrameType;
        const [type, payload] = typeof data === "string" ? [TextFrame, Buffer.from(data)] : [BinaryFrame, data];
        await this.sendDataFrame(spawnFrameData(type, {payload}));
    }

    async sendDataFrame(data: DataFrame): Promise<void> {
        if (this._state >= ConnectionState.Closing) {
            return;
        }
        try {
            await this.outgoingMessageBuffer.write(data);
        } catch (e) {
            this.close(CloseCode.AbnormalClosure, `Error while sending data: ${JSON.stringify(e.message)}`);
        }

    }

    private readonly parsedDataHandler = async (dataFrame: DataFrame) => {
        const {TextFrame, ConnectionClose, Ping, Pong, BinaryFrame} = DataFrameType;
        debug && console.log('>> parsedDataHandler', chalk.red(connectionStateToString(this._state)), dataFrame);
        const {type, payload} = dataFrame;

        if (this._state >= ConnectionState.Closing && type !== ConnectionClose) {
            debug && console.log('>> parsedDataHandler', chalk.red('stop'));
            return;
        }

        this.dataCallback.execute(dataFrame);
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
                this.messageCallback.execute(type === TextFrame ? payload.toString("utf8") : payload);
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
            this.close(ProtocolError, `Close frame payload too short (1 byte)`);
            return;
        }

        if (payload.length > 2 && !isValidUTF8(payload.slice(2))) {
            this.close(ProtocolError, `Close frame payload contain invalid UTF`);
            return;
        }

        if (payload.length > 125) {
            this.close(ProtocolError, `Close frame payload too long`);
            return;
        }

        const code = payload.length >= 2 ? payload.readUInt16BE(0) : null;
        const reason = payload.length > 2 ? payload.slice(2).toString("utf8") : null;

        // NoStatusRcvd & AbnormalClosure are not allowed to appear in data requests
        if (code !== null && ([NoStatusRcvd, AbnormalClosure].includes(code) || !isValidWebsocketCloseCode(code))) {
            this.close(ProtocolError, `Invalid close code received: ${{code}}`);
            return;
        }

        // TODO: Log close code and reason?
        this.close(code ?? NormalClosure);
    }

    private async processPingFrame({payload}: DataFrame): Promise<void> {
        if (this._state >= ConnectionState.Closing) {
            return;
        }

        if (payload.length > 125) {
            this.close(CloseCode.ProtocolError, `Ping payload exceed 125 byte limit`);
            return;
        }
        this.sendDataFrame(spawnFrameData(DataFrameType.Pong, {payload}));
    }

    private setState(newState: ConnectionState) {
        const {state: currentState} = this;
        debug && console.log('>> setState', {
            currentState: connectionStateToString(currentState),
            newState: connectionStateToString(newState)
        });
        if (newState <= currentState) {
            throw new Error(`Error while transitioning ws connection state - currentState: ${connectionStateToString(currentState)}, newState: ${connectionStateToString(newState)}`);
        }

        this._state = newState;
        this.stateChangeCallback.execute({state: newState, prevState: currentState})
    }

    private readonly socketErrorHandler = ({message}: Error) => this.close(CloseCode.AbnormalClosure, `Socket error: ${message}`);

    private readonly socketCloseHandler = () => {
        this.setState(ConnectionState.Closed);
        this.incomingMessageBuffer.destroy();
    }
}
