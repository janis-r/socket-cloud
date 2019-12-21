import {Event, EventDispatcher, EventListener, EventMapping} from "qft";
import {ClientConnection} from "../../clientConnectionPool";
import {ErrorEvent, MessageEvent, StateChangeEvent} from "../../clientConnectionPool/connectionEvent";
import {DataFrame} from "../data/DataFrame";

type ClientConnectionBroadcastingNature = Pick<ClientConnection, "addEventListener" | "removeEventListener" | "removeAllEventListeners">;

export abstract class ClientConnectionEventBase extends EventDispatcher implements ClientConnectionBroadcastingNature {

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object): EventMapping;
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object): EventMapping;
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object): EventMapping;
    addEventListener(event: "data-frame", listener: EventListener<Event<DataFrame>>, scope?: Object): EventMapping;
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): EventMapping {
        return super.addEventListener(event, listener, scope);
    }

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    removeEventListener(event: "data-frame", listener: EventListener<Event<DataFrame>>, scope?: Object);
    removeEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object) {
        return super.removeEventListener(event, listener, scope);
    }
}
