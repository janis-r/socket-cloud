import {connectWebsocket} from "./connectWebsocket";
import {globalMessageChannel, pocmddpProtocol} from "../../../lib/deliveryProtocol";
import {WebsocketConnection} from "../../../lib/websocketListener";
import {CallbackCollection} from "../../../lib/utils/CallbackCollection";
import {
    deserializeServerMessage,
    MessageType,
    pushToServerUtil,
    ServerMessage,
    subscribeMessageUtil,
    unsubscribeMessageUtil
} from "../../../lib/deliveryProtocol/data";

const protocol = pocmddpProtocol;

export class SocketClient {
    private static ID = 0;

    readonly connectionId = SocketClient.ID++;
    readonly initialized: Promise<this>;

    private readonly onMessageCallback = new CallbackCollection<ServerMessage>();
    readonly onMessage = this.onMessageCallback.polymorph;

    private _connection: WebsocketConnection;
    private _authKey: string;

    constructor(readonly url: string) {
        this.initialized = this.initialize();
    }

    private async initialize(): Promise<this> {
        const {url, connectionId} = this;
        const {socket, authKey} = await connectWebsocket(`${url}?externalId=${connectionId}`);
        this._connection = new WebsocketConnection(socket, {id: 'test', protocol});
        this._authKey = authKey;

        this._connection.onMessage(data => {
            if (typeof data !== "string") {
                throw new Error('Binary data is not expected in here!');
            }

            const message = deserializeServerMessage(data);
            this.onMessageCallback.execute(message);
        });

        return this;
    }

    get connection() {
        return this._connection;
    }

    get authKey(): string {
        return this._authKey;
    }

    subscribe(...channels: string[]): void {
        console.log('>> subscribe', ...channels);
        this._connection.send(subscribeMessageUtil.serialize({type: MessageType.Subscribe, channels}));
    }

    unsubscribe(...channels: string[]): void {
        console.log('>> unsubscribe', ...channels);
        this._connection.send(unsubscribeMessageUtil.serialize({type: MessageType.Unsubscribe, channels}));
    }

    sendGlobalMessage(data: string): void {
        this.sendChannelMessage(data, globalMessageChannel);
    }

    sendChannelMessage(data: string, ...channels: string[]): void {
        console.log('>> sendChannelMessage', channels, data);
        this._connection.send(pushToServerUtil.serialize({
            type: MessageType.PushToServer,
            channels,
            payload: data
        }));
    }

    close() {
        this._connection.close();
    }
}

export const spawnConnections = async (count: number, serverUrl: string): Promise<Array<SocketClient>> => {

    const wrappers: Array<SocketClient> = new Array(count).fill(0).map(() => new SocketClient(serverUrl));
    await Promise.all(wrappers.map(({initialized}) => initialized));

    return wrappers;
};
