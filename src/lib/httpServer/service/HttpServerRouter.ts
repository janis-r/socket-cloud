import { HttpRequestHandler } from "../data/HttpRequestHandler";
import { Router } from "../data/Router";

export abstract class HttpServerRouter {

    abstract use(path: string, ...handlers: HttpRequestHandler[]): this;
    abstract use(path: string, router: Router): this;
    abstract get(path: string, ...handlers: HttpRequestHandler[]): this;
    abstract post(path: string, ...handlers: HttpRequestHandler[]): this;
    abstract patch(path: string, ...handlers: HttpRequestHandler[]): this;
    abstract put(path: string, ...handlers: HttpRequestHandler[]): this;
    abstract delete(path: string, ...handlers: HttpRequestHandler[]): this;

}

