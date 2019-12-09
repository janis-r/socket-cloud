import {EventDispatcher, EventListener} from "qft";
import {ClientConnection, DataEvent, ErrorEvent, MessageEvent, StateChangeEvent} from "../../socketServer";

type ClientConnectionBroadcastingNature = Pick<ClientConnection, "addEventListener" | "removeEventListener" | "removeAllEventListeners">;

export abstract class ClientConnectionEventBase extends EventDispatcher implements ClientConnectionBroadcastingNature {

    addEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    addEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    addEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object);
    addEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object) {
        return super.addEventListener(event, listener, scope);
    }

    removeEventListener(event: "state-change", listener: EventListener<StateChangeEvent>, scope?: Object);
    removeEventListener(event: "message", listener: EventListener<MessageEvent>, scope?: Object);
    removeEventListener(event: "data", listener: EventListener<DataEvent>, scope?: Object);
    removeEventListener(event: "error", listener: EventListener<ErrorEvent>, scope?: Object);
    removeEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object): boolean {
        return super.removeEventListener(event, listener, scope);
    }
}
