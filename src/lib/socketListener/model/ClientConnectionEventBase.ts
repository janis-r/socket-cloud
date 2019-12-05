import {EventDispatcher, EventListener} from "qft";
import {ClientConnection, DataEvent, ErrorEvent, MessageEvent, StateChangeEvent} from "../../socketServer";

type ClientConnectionBroadcastingNature = Pick<ClientConnection, "addEventListener" | "removeEventListener" | "removeAllEventListeners">;

export abstract class ClientConnectionEventBase extends EventDispatcher implements ClientConnectionBroadcastingNature {

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    addEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object) {
        return super.addEventListener(eventNameProxy(event), listener, scope);
    }

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    removeEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    removeEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): boolean {
        return super.removeEventListener(eventNameProxy(event), listener, scope);
    }
}

const eventMap = new Map<string, Symbol>([
    ["state-change", StateChangeEvent.TYPE],
    ["message", MessageEvent.TYPE],
    ["data", DataEvent.TYPE],
    ["error", ErrorEvent.TYPE]
]);
const eventNameProxy = (event: string | Symbol) => typeof event === "string" && eventMap.has(event) ? eventMap.get(event) : event;
