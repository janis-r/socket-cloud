import * as crypto from "crypto";
import { ConnectionState } from "../../../clientConnectionPool/data/ConnectionState";
import { CloseCode } from "../../data/CloseCode";
import { spawnFrameData } from "../../util/websocket-utils";
import { DataFrameType } from "../../data/DataFrameType";
import { DataFrame } from "../../data/DataFrame";
import { WebsocketConnection } from "../WebsocketConnection";

export class KeepAliveManager {

    private readonly pingTimeout: number;
    private pingInProgress: { id: string, time: number };
    private nextPingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private connectivityErrorTimoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(readonly connection: WebsocketConnection) {
        if (!connection.context.pingTimeout) {
            return;
        }
        this.pingTimeout = connection.context.pingTimeout;
        this.start();
    }

    private start(): void {
        const { connection, handleIncomingMessage, stop, sendPing, pingTimeout } = this;
        connection.onData(data => handleIncomingMessage(data));
        connection.onStateChange(({ state }) => {
            if (state >= ConnectionState.Closing) {
                stop();
            }
        });

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
    };

    private sendPing = async (): Promise<void> => {
        const { connection, pingTimeout, handleLostConnection } = this;

        const payload = crypto.randomBytes(4);
        this.pingInProgress = { id: payload.toString("hex"), time: Date.now() };
        console.log('>> ping', this.pingInProgress);
        await connection.sendDataFrame(spawnFrameData(DataFrameType.Ping, { payload }));
        this.connectivityErrorTimoutId = setTimeout(handleLostConnection, pingTimeout);
    };

    private readonly handleIncomingMessage = ({ type, payload }: DataFrame): void => {
        const { pingInProgress, sendPing, pingTimeout } = this;
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
