import {ClientMessageEvent, ConnectionCloseEvent, ConnectionErrorEvent} from "..";
import {EventListener} from "qft";

export interface ClientConnection {

    readonly remoteAddress: string;
    readonly closed: boolean;

    addEventListener(event: "message", listener: EventListener<ClientMessageEvent>, scope?: Object);
    addEventListener(event: "close", listener: EventListener<ConnectionCloseEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ConnectionErrorEvent>, scope?: Object);

    removeEventListener(event: "close", listener: EventListener<ConnectionCloseEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<ClientMessageEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ConnectionErrorEvent>, scope?: Object);

    removeAllEventListeners(scope?: Object): boolean;

}
