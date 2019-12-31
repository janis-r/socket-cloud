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

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping<StateChangeEvent>;
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping<MessageEvent>;
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping<ErrorEvent>;

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping<StateChangeEvent>;
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping<MessageEvent>;
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping<ErrorEvent>;

    removeAllEventListeners(scope?: Object): boolean;
}