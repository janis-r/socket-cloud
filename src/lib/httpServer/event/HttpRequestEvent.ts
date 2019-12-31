import {Event} from "qft";
import {IncomingMessage, ServerResponse} from "http";

export class HttpRequestEvent extends Event {
    static readonly TYPE = Symbol('http-request-event');

    constructor(readonly request: IncomingMessage, readonly response: ServerResponse) {
        super(HttpRequestEvent.TYPE);
    }
}



