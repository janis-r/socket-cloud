import * as crypto from "crypto";
import {WebsocketClientConnection} from "../WebsocketClientConnection";
import {ConnectionState} from "../../../clientConnectionPool";
import {CloseCode} from "../../data/CloseCode";
import {spawnFrameData} from "../../util/websocket-utils";
import {DataFrameType} from "../../data/DataFrameType";
import {DataFrame} from "../../data/DataFrame";
import {StateChangeEvent} from "../../../clientConnectionPool/connectionEvent";

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
            ({connection: {state}}) => state >= ConnectionState.Closing
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
        await connection.sendDataFrame(spawnFrameData(DataFrameType.Ping, {payload}));
        this.connectivityErrorTimoutId = setTimeout(handleLostConnection, pingTimeout);
    };

    private readonly handleIncomingMessage = ({type, payload}: DataFrame): void => {
        const {pingInProgress, sendPing, pingTimeout} = this;

        if (type === DataFrameType.Pong && payload && payload.length > 0) {
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
        this.connection.close(CloseCode.AbnormalClosure, "socket-connection-is-lost");
    };
}
