import {IncomingMessage} from "http";

export type UpgradeRequest = IncomingMessage & {
    headers: IncomingMessage['headers'] & {
        'origin'?: string,
        'sec-websocket-origin'?: string,
        'sec-websocket-key'?: string,
        'sec-websocket-extensions'?: string,
        'sec-websocket-version'?: string,
        'x-forwarded-for'?: string,
    }
};
