import {ConnectionState} from "../../clientConnectionPool/data/ConnectionState";
import {Callback} from "../../utils/CallbackCollection";
import {CloseCode} from "../../websocketConnection/data/CloseCode";

/**
 * Interface to be implemented by any socket connection client either browser built in WebSocket or custom
 * client in server to server communication, so they can be handled on same terms.
 */
export interface Adapter {
    /**
     * Connection state
     */
    readonly state: ConnectionState;
    /**
     * Connection open callback
     */
    readonly onOpen: Callback<void>;
    /**
     * Incoming message callback
     */
    readonly onMessage: Callback<string>;
    /**
     * Connection error callback
     */
    readonly onError: Callback<string>;
    /**
     * Connection close callback
     */
    readonly onClose: Callback<{ code?: CloseCode, reason?: string }>;

    /**
     * Send message to server
     */
    send(message: string): void;

    /**
     * Close connection.
     * @param code
     * @param reason
     */
    close(code?: CloseCode, reason?: string): void;
}
