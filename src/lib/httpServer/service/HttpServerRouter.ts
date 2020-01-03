import {Injectable} from "qft";
import {HttpMethod} from "../../types/HttpMethod";
import {IncomingMessage, ServerResponse} from "http";

@Injectable()
export class HttpServerRouter {

    private readonly mappings = new Map<HttpMethod, Map<UrlDescriptor, UrlHandler>>();

    get(url: UrlDescriptor, handler: UrlHandler): void {
        this.setHandler(HttpMethod.GET, url, handler);
    }

    post(url: UrlDescriptor, handler: UrlHandler): void {
        this.setHandler(HttpMethod.POST, url, handler);
    }

    getHandler(method: HttpMethod, url: UrlDescriptor): UrlHandler | null {
        const {mappings} = this;
        if (mappings.has(method) && mappings.get(method).has(url)) {
            return mappings.get(method).get(url);
        }

        return null;
    }


    private setHandler(method: HttpMethod, url: UrlDescriptor, handler: UrlHandler): void {
        const {mappings} = this;
        if (!mappings.has(method)) {
            mappings.set(method, new Map<UrlDescriptor, UrlHandler>([[url, handler]]));
        } else {
            mappings.get(method).set(url, handler);
        }
    }
}

type UrlDescriptor = string;
type UrlHandler = (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
