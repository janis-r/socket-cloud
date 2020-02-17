import {
    deserializeServerMessage,
    globalMessageChannel,
    MessageType,
    PushToClientMessage,
    pushToServerUtil,
    RestoreChannelsResponseMessage,
    restoreRequestUtil,
    RestoreTarget,
    subscribeMessageUtil,
    unsubscribeMessageUtil
} from "../../deliveryProtocol";
import {CallbackCollection} from "../../utils/CallbackCollection";
import {Adapter} from "../data/Adapter";

const {RestoreResponse, RestoreRequest, Unsubscribe, PushToClient, Subscribe, PushToServer} = MessageType;

export class SocketClient {

    private readonly onMessageCallback = new CallbackCollection<PushToClientMessage>();
    private readonly onRestoreCallback = new CallbackCollection<RestoreChannelsResponseMessage>();

    constructor(private readonly connection: Adapter) {
        connection.onError(this.errorHandler);
        connection.onMessage(this.messageHandler);
    }

    private readonly errorHandler = (error: string) => {
        console.error("Connection error:", error);
    };

    private readonly messageHandler = (data: string) => {
        const {onMessageCallback, onRestoreCallback} = this;
        const message = deserializeServerMessage(data);
        switch (message.type) {
            case PushToClient:
                onMessageCallback.execute(message);
                break;
            case RestoreResponse:
                onRestoreCallback.execute(message);
                break;
            default:
                console.error(`Message of unknown type received:`, message);
        }
    };

    /**
     * Incoming data message callback
     */
    readonly onMessage = this.onMessageCallback.manage;

    /**
     * Channel restore data callback
     */
    readonly onRestore = this.onRestoreCallback.manage;

    /**
     * Subscribe to data channel.
     * @param channels Channel or list of channels to subscribe to
     */
    subscribe(...channels: string[]): void {
        this.connection.send(subscribeMessageUtil.serialize({type: Subscribe, channels}));
    }

    /**
     * Unsubscribe from data channel.
     * @param channels Channel or list of channels to unsubscribe from
     */
    unsubscribe(...channels: string[]): void {
        this.connection.send(unsubscribeMessageUtil.serialize({type: Unsubscribe, channels}));
    }

    /**
     * Restore data channel messages with optional filter
     * @param channels Description of single or list of restore targets consisting of channel name and optional
     * cache filter definitions.
     */
    restore(...channels: RestoreTarget[]): void {
        this.connection.send(restoreRequestUtil.serialize({type: RestoreRequest, channels}));
    }

    /**
     * Send message to all data context subscribers
     * @param data Data to be delivered.
     */
    sendGlobalMessage(data: string): void {
        this.sendChannelMessage(data, globalMessageChannel);
    }

    /**
     * Send message to subscribers of a single or multiple channels.
     * @param data Data to be delivered.
     * @param channels Channel or list of channels to send message to.
     */
    sendChannelMessage(data: string, ...channels: string[]): void {
        this.connection.send(pushToServerUtil.serialize({
            type: PushToServer,
            channels,
            payload: data
        }));
    }

    /**
     * Close connection
     */
    close() {
        this.connection.close();
    }
}



