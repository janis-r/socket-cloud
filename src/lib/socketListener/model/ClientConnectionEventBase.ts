import {Event, EventDispatcher, EventListener, EventMapping} from "qft";
import {ClientConnection, DataEvent, ErrorEvent, MessageEvent, StateChangeEvent} from "../../socketServer";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";

type ClientConnectionBroadcastingNature = Pick<ClientConnection, "addEventListener" | "removeEventListener" | "removeAllEventListeners">;

export abstract class ClientConnectionEventBase extends EventDispatcher implements ClientConnectionBroadcastingNature {

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping;
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping;
    addEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object): EventMapping;
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping;
    addEventListener(event: "data-frame", listener: EventListener<Event<WebsocketDataFrame>>, scope?: Object): EventMapping;
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): EventMapping {
        return super.addEventListener(event, listener, scope);
    }

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): boolean;
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): boolean;
    removeEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object): boolean;
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): boolean;
    removeEventListener(event: "data-frame", listener: EventListener<Event<WebsocketDataFrame>>, scope?: Object): boolean;
    removeEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): boolean {
        return super.removeEventListener(event, listener, scope);
    }
}
