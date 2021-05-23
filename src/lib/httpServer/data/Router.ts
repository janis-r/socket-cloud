import { HttpServerRouter } from "../service/HttpServerRouter";
import { HttpRequestHandler } from "./HttpRequestHandler";
import { HttpMethod } from "./HttpMethod";
import { isSingleRouter } from "../util/isSingleRouter";

/**
 * Semi functional router that serves only as a holder of http methods to handlers mapping.
 */
export class Router implements HttpServerRouter {

    private readonly _routes = new Map<Method, Map<string, HttpRequestHandler[]>>();

    readonly routes: ReadonlyMap<Method, ReadonlyMap<string, HttpRequestHandler[]>> = this._routes;

    private addRoute(method: Method, path: string, handlers: HttpRequestHandler[]): void {
        const { _routes } = this;
        if (!_routes.has(method)) {
            _routes.set(method, new Map([[path, handlers]]));
        } else {
            _routes.get(method).set(path, handlers);
        }
    }

    use(path: string, ...handlers: HttpRequestHandler[]): this;
    use(path: string, router: Router): this;
    use(path: string, ...handlers: HttpRequestHandler[] | [Router]): this {
        if (isSingleRouter(handlers)) {
            // TODO: ......
            throw new Error(`Not implemented`);
        } else {
            this.addRoute("use", path, handlers);
        }
        return this;
    }

    get(path: string, ...handlers: HttpRequestHandler[]) {
        this.addRoute(HttpMethod.GET, path, handlers);
        return this;
    }

    post(path: string, ...handlers: HttpRequestHandler[]) {
        this.addRoute(HttpMethod.POST, path, handlers);
        return this;
    }

    patch(path: string, ...handlers: HttpRequestHandler[]) {
        this.addRoute(HttpMethod.PATCH, path, handlers);
        return this;
    }

    put(path: string, ...handlers: HttpRequestHandler[]) {
        this.addRoute(HttpMethod.PUT, path, handlers);
        return this;
    }

    delete(path: string, ...handlers: HttpRequestHandler[]) {
        this.addRoute(HttpMethod.DELETE, path, handlers);
        return this;
    }
}

type Method = "use" | HttpMethod.GET | HttpMethod.POST | HttpMethod.PATCH | HttpMethod.PUT | HttpMethod.DELETE;
