import {HttpRequestHandler} from "../data/HttpRequestHandler";

export abstract class HttpServerRouter {

    abstract get(url: string, handler: HttpRequestHandler): void;
    abstract post(url: string, handler: HttpRequestHandler): void;

}

