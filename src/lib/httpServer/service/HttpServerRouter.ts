import {HttpRequestHandler} from "../data/HttpRequestHandler";

export abstract class HttpServerRouter {

    abstract use(url: string, handler: HttpRequestHandler): void;
    abstract get(url: string, handler: HttpRequestHandler): void;
    abstract post(url: string, handler: HttpRequestHandler): void;
    abstract put(url: string, handler: HttpRequestHandler): void;
    abstract delete(url: string, handler: HttpRequestHandler): void;

}

