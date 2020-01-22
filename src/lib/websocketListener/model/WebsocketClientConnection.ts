import {Socket} from "net";
import {ClientConnection, CloseReason} from "../../clientConnectionPool";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {ConfigurationContext} from "../../configurationContext";
import {SocketDescriptor} from "../data/SocketDescriptor";
import {OperatorData} from "../data/OperatorData";
import {WebsocketConnection} from "./WebsocketConnection";
import {ClientConnectionEventBase} from "./ClientConnectionEventBase";
import {ErrorEvent, MessageEvent, StateChangeEvent} from "../../clientConnectionPool/connectionEvent";

export const debug = false;

export class WebsocketClientConnection extends ClientConnectionEventBase implements ClientConnection {

    private readonly connection: WebsocketConnection;

    readonly id: ClientConnection['id'];
    readonly externalId: string;

    constructor(socket: Socket, readonly context: ConfigurationContext, extensions: ReadonlyArray<WebsocketExtensionAgent>,
                descriptor: SocketDescriptor, operatorData?: OperatorData) {
        super();

        debug && console.log({descriptor, context});

        this.id = descriptor.connectionId;
        this.externalId = operatorData?.externalId;

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
