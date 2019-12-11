import * as crypto from "crypto";
import {WebsocketClientConnection} from "../WebsocketClientConnection";
import {ConnectionState, StateChangeEvent} from "../../../socketServer";
import {WebsocketCloseCode} from "../../data/WebsocketCloseCode";
import {spawnFrameData} from "../../util/websocket-utils";
import {WebsocketDataFrameType} from "../../data/WebsocketDataFrameType";
import {WebsocketDataFrame} from "../../data/WebsocketDataFrame";

export class KeepAliveManager {

    private readonly pingTimeout: number;
    private pingInProgress: { id: string, time: number };
    private nextPingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private connectivityErrorTimoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(readonly connection: WebsocketClientConnection) {
        if (!connection.context.pingTimeout) {
            return;
        }
        this.pingTimeout = connection.context.pingTimeout;
        this.start();
    }

    private start(): void {
        const {connection, handleIncomingMessage, stop, sendPing, pingTimeout} = this;
        connection.addEventListener("data-frame", ({data}) => () => handleIncomingMessage(data), this);
        connection.addEventListener("state-change", stop, this).withGuards(
            ({connection: {state}}: StateChangeEvent) => state >= ConnectionState.Closing
        ).once();

        this.nextPingTimeoutId = setTimeout(sendPing, pingTimeout);
    }

    private readonly stop = (): void => {
        if (this.nextPingTimeoutId) {
            clearTimeout(this.nextPingTimeoutId);
            this.nextPingTimeoutId = null;
        }
        if (this.connectivityErrorTimoutId) {
            clearTimeout(this.connectivityErrorTimoutId);
            this.connectivityErrorTimoutId = null;
        }
        this.connection.removeAllEventListeners(this);
    };

    private sendPing = async (): Promise<void> => {
        const {connection, pingTimeout, handleLostConnection} = this;

        const payload = crypto.randomBytes(4);
        this.pingInProgress = {id: payload.toString("hex"), time: Date.now()};
        console.log('>> ping', this.pingInProgress);
        await connection.sendDataFrame(spawnFrameData(WebsocketDataFrameType.Ping, {payload}));
        this.connectivityErrorTimoutId = setTimeout(handleLostConnection, pingTimeout);
    };

    private readonly handleIncomingMessage = ({type, payload}: WebsocketDataFrame): void => {
        const {pingInProgress, sendPing, pingTimeout} = this;

        if (type === WebsocketDataFrameType.Pong && payload && payload.length > 0) {
            const pingId = payload.toString("hex");
            if (pingId === pingInProgress?.id) {
                // TODO: Maybe this one should be logged?
                console.log('>> Pong received in', Date.now() - pingInProgress.time, 'ms');
            }
        }

        clearTimeout(this.connectivityErrorTimoutId);
        this.connectivityErrorTimoutId = null;

        if (this.nextPingTimeoutId) {
            clearTimeout(this.nextPingTimeoutId);
        }

        this.nextPingTimeoutId = setTimeout(sendPing, pingTimeout);
    };

    private readonly handleLostConnection = (): void => {
        this.connection.close(WebsocketCloseCode.AbnormalClosure, "socket-connection-is-lost");
    };
}
