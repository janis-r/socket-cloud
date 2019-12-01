import {EventListener} from "qft";
import {MessageEvent, ErrorEvent} from "..";
import {ConnectionState} from "../data/ConnectionState";
import {StateChangeEvent} from "../event/StateChangeEvent";
import {ConfigurationContext} from "../../configurationContext";
import {WebsocketDescriptor} from "../../socketListener/data/SocketDescriptor";

export interface ClientConnection {

    readonly descriptor: WebsocketDescriptor;
    readonly context: ConfigurationContext;
    readonly state: ConnectionState;

    send(message: string);

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);

    removeAllEventListeners(scope?: Object): boolean;

}
