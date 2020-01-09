import {Injectable} from "qft";
import {HttpRequestHandler} from "../data/HttpRequestHandler";
import {HttpServerService} from "./HttpServerService";

// @Injectable()
export abstract class HttpServerRouter {

    abstract get(url: string, handler: HttpRequestHandler): void;
    abstract post(url: string, handler: HttpRequestHandler): void;

    /*constructor(readonly httpServerService: HttpServerService) {
    }

    get(url: string, handler: UrlHandler): void {
        const {httpServerService: {expressApp}} = this;
        expressApp.get(url, handler);
    }

    post(url: string, handler: UrlHandler): void {
        const {httpServerService: {expressApp}} = this;
        expressApp.post(url, handler);
    }*/
}

