import {Socket} from "net";
import {ClientConnection} from "../../clientConnectionPool/model/ClientConnection";
import {CloseReason} from "../../clientConnectionPool/data/CloseReason";
import {WebsocketExtensionAgent} from "../../websocketExtension/service/WebsocketExtensionAgent";
import {SocketDescriptor} from "../data/SocketDescriptor";
import {OperatorHandshakeResponse} from "../data/OperatorHandshakeResponse";
import {WebsocketConnection} from "../../websocketConnection/model/WebsocketConnection";
import {ClientConnectionEventBase} from "./ClientConnectionEventBase";
import {ErrorEvent} from "../../clientConnectionPool/connectionEvent/ErrorEvent";
import {MessageEvent} from "../../clientConnectionPool/connectionEvent/MessageEvent";
import {ConfigurationContext} from "../../configurationContext/data/ConfigurationContext";
import {StateChangeEvent} from "../../clientConnectionPool/connectionEvent/StateChangeEvent";

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private readonly connection: WebsocketConnection;

    readonly id: ClientConnection['id'];
    readonly externalId: string;
    readonly remoteAddress;

    constructor(socket: Socket, readonly context: ConfigurationContext, extensions: ReadonlyArray<WebsocketExtensionAgent>,
                descriptor: SocketDescriptor, operatorData?: OperatorHandshakeResponse) {
        super();

        this.id = descriptor.connectionId;
        this.externalId = operatorData?.externalId;
        this.remoteAddress = descriptor.ipAddress;

        this.connection = new WebsocketConnection(socket, context, extensions);
        const {connection} = this;
        connection.onError(({message, code}) => this.dispatchEvent(new ErrorEvent(this, message, code)));
        connection.onData(dataFrame => this.dispatchEvent("data-frame", dataFrame));
        connection.onMessage(message => this.dispatchEvent(new MessageEvent(this, message)));
        connection.onStateChange(({prevState}) => this.dispatchEvent(new StateChangeEvent(this, prevState)));
    }

    get state() {
        return this.connection.state;
    }

    send(data: Buffer): Promise<void>;
    send(data: string): Promise<void>;
    async send(data: string | Buffer): Promise<void> {
        if (typeof data === "string") { // TODO: This construction seem ridiculous and I don't have a quick fix to it
            return this.connection.send(data);
        }
        return this.connection.send(data);
    }

    async close(reason: keyof CloseReason, message?: string): Promise<void> {
        await this.connection.close(reason, message);
    }


}
