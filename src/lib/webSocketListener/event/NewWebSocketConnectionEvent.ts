import {Event} from "qft";
import {ConfigurationContext} from "../../configurationContext";

/**
 * Event notification dispatched as new WebSocket connection is encountered and ready to be added to connection pool.
 * This event is dispatched in order to let third parties prevent thi connection being established.
 */
export class NewWebSocketConnectionEvent extends Event {
    static readonly TYPE = 'new-web-socket-connection-event';

    private _preventReason: string;

    constructor(readonly origin: string, readonly remoteAddress: string, readonly context: ConfigurationContext) {
        super(NewWebSocketConnectionEvent.TYPE);
    }

    /**
     * Prevent event default action, which is adding new WS connection with message.
     * @param msg
     */
    prevent(msg?: string): void {
        if (!this.defaultPrevented) {
            this._preventReason = msg;
            this.preventDefault();
        }
    }


    get preventReason(): string {
        return this._preventReason;
    }
}
