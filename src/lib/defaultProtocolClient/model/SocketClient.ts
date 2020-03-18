import {CallbackCollection} from "../../utils/CallbackCollection";
import {Adapter} from "../data/Adapter";
import {RestoreChannelsResponseMessage} from "@defaultProtocol/data/serverMessage/RestoreChannelsResponseMessage";
import {deserializeServerMessage} from "@defaultProtocol/data/serverMessage/ServerMessage";
import {MessageType} from "@defaultProtocol/data/MessageType";
import {subscribeMessageUtil} from "@defaultProtocol/data/clientMessage/SubscribeMessage";
import {unsubscribeMessageUtil} from "@defaultProtocol/data/clientMessage/UnsubscribeMessage";
import {restoreRequestUtil, RestoreTarget} from "@defaultProtocol/data/clientMessage/RestoreChannelsRequestMessage";
import {globalMessageChannel} from "@defaultProtocol/data/globalMessageChannel";
import {pushToServerUtil} from "@defaultProtocol/data/clientMessage/PushToServerMessage";
import {PushToClientMessage} from "@defaultProtocol/data/serverMessage/PushToClientMessage";

/**
 * A socket client connector that'll take socket connection wrapped as Adapter and wrap it into implementation
 * of default protocol connection API
 */
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
            case MessageType.PushToClient:
                onMessageCallback.execute(message);
                break;
            case MessageType.RestoreResponse:
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
        this.connection.send(subscribeMessageUtil.serialize({type: MessageType.Subscribe, channels}));
    }

    /**
     * Unsubscribe from data channel.
     * @param channels Channel or list of channels to unsubscribe from
     */
    unsubscribe(...channels: string[]): void {
        this.connection.send(unsubscribeMessageUtil.serialize({type: MessageType.Unsubscribe, channels}));
    }

    /**
     * Restore data channel messages with optional filter
     * @param channels Description of single or list of restore targets consisting of channel name and optional
     * cache filter definitions.
     */
    restore(...channels: RestoreTarget[]): void {
        this.connection.send(restoreRequestUtil.serialize({type: MessageType.RestoreRequest, channels}));
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
            type: MessageType.PushToServer,
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

["connection", "onMessageCallback", "onRestoreCallback", "errorHandler", "messageHandler"].forEach(prop =>
    Object.defineProperty(SocketClient, prop, {
        enumerable: false,
        writable: false
    })
);


