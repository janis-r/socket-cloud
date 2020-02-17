import {CloseCode} from "../../websocketConnection/data/CloseCode";
import {ConnectionState} from "../../clientConnectionPool";
import {CallbackCollection} from "../../utils/CallbackCollection";
import {Adapter} from "../data/Adapter";

export class WebSocketAdapter implements Adapter {

    private onOpenCallback = new CallbackCollection<void>();
    private onMessageCallback = new CallbackCollection<string>();
    private onErrorCallback = new CallbackCollection<string>();
    private onCloseCallback = new CallbackCollection<{ code?: CloseCode; reason?: string }>();

    private readonly socket: WebSocket;

    constructor(url: string) {
        this.socket = new WebSocket(url);
        this.socket.onopen = () => this.onOpenCallback.execute();
        this.socket.onmessage = ({data}) => this.onMessageCallback.execute(data);
        this.socket.onerror = event => this.onErrorCallback.execute(event.toString());
        this.socket.onclose = ({code, reason}) => this.onCloseCallback.execute({code, reason});
    }

    readonly onOpen = this.onOpenCallback.manage;
    readonly onMessage = this.onMessageCallback.manage;
    readonly onError = this.onErrorCallback.manage;
    readonly onClose = this.onCloseCallback.manage;

    get state(): ConnectionState {
        return this.socket.readyState;
    }

    send(message: string): void {
        this.socket.send(message);
    }

    close(code?: CloseCode, reason?: string): void {
        this.socket.close(code, reason);
    }
}
