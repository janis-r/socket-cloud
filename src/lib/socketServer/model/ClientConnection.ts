import {Event, EventListener} from "qft";
import {ConnectionState} from "../data/ConnectionState";
import {ConfigurationContext} from "../../configurationContext";
import {DataEvent, ErrorEvent, MessageEvent, StateChangeEvent} from "..";

export interface ClientConnection {

    readonly context: ConfigurationContext;
    readonly state: ConnectionState;

    send(message: string);
    send(message: Buffer);

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    addEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    removeEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);

    removeAllEventListeners(scope?: Object): boolean;
}
