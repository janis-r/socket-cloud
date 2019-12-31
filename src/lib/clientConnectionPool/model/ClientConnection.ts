import {EventListener, EventMapping} from "qft";
import {ConnectionState} from "../data/ConnectionState";
import {ConfigurationContext} from "../../configurationContext";
import {ErrorEvent, MessageEvent, StateChangeEvent} from "../connectionEvent";

export interface ClientConnection {

    readonly id: string;
    readonly context: ConfigurationContext;
    readonly state: ConnectionState;

    send(message: string): Promise<void>;
    send(message: Buffer): Promise<void>;

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping;
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping;
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping;

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping;
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping;
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping;

    removeAllEventListeners(scope?: Object): boolean;
}
