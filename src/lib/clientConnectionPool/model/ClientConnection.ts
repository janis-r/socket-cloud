import {EventListener, EventMapping} from "quiver-framework";
import {ConnectionState} from "../data/ConnectionState";
import {ConfigurationContext} from "../../configurationContext";
import {ErrorEvent, MessageEvent, StateChangeEvent} from "../connectionEvent";
import {CloseReason} from "../data/CloseReason";

export interface ClientConnection {

    readonly id: string;
    readonly externalId: string;
    readonly context: Readonly<ConfigurationContext>;
    readonly state: ConnectionState;
    readonly remoteAddress: string;

    send(message: string): Promise<void>;
    send(message: Buffer): Promise<void>;

    close(reason: CloseReason, message?: string): Promise<void>;

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping<StateChangeEvent>;
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping<MessageEvent>;
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping<ErrorEvent>;

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping<StateChangeEvent>;
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping<MessageEvent>;
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping<ErrorEvent>;

    removeAllEventListeners(scope?: Object): boolean;
}
