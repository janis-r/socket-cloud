import {connectWebsocket} from "./connectWebsocket";
import {
    deserializeServerMessage,
    globalMessageChannel,
    MessageType,
    pocmddpProtocol,
    PushToClientMessage,
    pushToServerUtil,
    RestoreChannelsRequestMessage,
    RestoreChannelsResponseMessage,
    restoreRequestUtil,
    subscribeMessageUtil,
    unsubscribeMessageUtil
} from "../../../lib/deliveryProtocol";
import {CallbackCollection} from "../../../lib/utils/CallbackCollection";
import {ContextId} from "../../../lib/configurationContext";
import {WebsocketConnection} from "../../../lib/websocketConnection";

const protocol = pocmddpProtocol;

export class SocketClient {
    private static ID = 0;

    readonly connectionId = SocketClient.ID++;
    readonly initialized: Promise<this>;

    private readonly onMessageCallback = new CallbackCollection<PushToClientMessage>();
    private readonly onRestoreCallback = new CallbackCollection<RestoreChannelsResponseMessage>();
    readonly onMessage = this.onMessageCallback.polymorph;
    readonly onRestore = this.onRestoreCallback.polymorph;

    private _connection: WebsocketConnection;
    private _authKey: string;

    constructor(readonly url: string, readonly contextId: ContextId) {
        this.initialized = this.initialize();
    }

    private async initialize(): Promise<this> {
        const {url, contextId, connectionId} = this;
        const {socket, authKey} = await connectWebsocket(`${url}/${contextId}?externalId=${connectionId}`);
        this._connection = new WebsocketConnection(socket, {id: contextId, protocol});
        this._authKey = authKey;

        this._connection.onError(err => {
            throw new Error(err.message);
        });

        this._connection.onMessage(data => {
            if (typeof data !== "string") {
                throw new Error('Binary data is not expected in here!');
            }

            const message = deserializeServerMessage(data);
            switch (message.type) {
                case MessageType.PushToClient:
                    this.onMessageCallback.execute(message);
                    break;
                case MessageType.RestoreResponse:
                    this.onRestoreCallback.execute(message);
                    break;
                default:
                    throw new Error(`Message of unknown type received: ${message}`);
            }

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
        this._connection.send(subscribeMessageUtil.serialize({type: MessageType.Subscribe, channels}));
    }

    unsubscribe(...channels: string[]): void {
        this._connection.send(unsubscribeMessageUtil.serialize({type: MessageType.Unsubscribe, channels}));
    }

    restore(...channels: RestoreChannelsRequestMessage['channels']): void {
        this._connection.send(restoreRequestUtil.serialize({type: MessageType.RestoreRequest, channels}));
    }

    sendGlobalMessage(data: string): void {
        this.sendChannelMessage(data, globalMessageChannel);
    }

    sendChannelMessage(data: string, ...channels: string[]): void {
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

export const spawnConnections = async (serverUrl: string, contextId: ContextId, count: number): Promise<Array<SocketClient>> => {
    const clients: Array<SocketClient> = new Array(count).fill(0).map(() => new SocketClient(serverUrl, contextId));
    await Promise.all(clients.map(({initialized}) => initialized));
    return clients;
};
