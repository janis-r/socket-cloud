import {IncomingMessage} from "http";

export type WebsocketUpgradeRequest = IncomingMessage & {
    headers: IncomingMessage['headers'] & {
        'origin'?: string,
        'sec-websocket-origin'?: string,
        'sec-websocket-key'?: string,
        'sec-websocket-extensions'?: string
    }
};
