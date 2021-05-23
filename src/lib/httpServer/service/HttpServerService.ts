import * as http from "http";
import * as https from "https";
import express, { Express, NextFunction, Request, Response } from "express";
import fs from "fs";
import bodyParser from "body-parser";
import compression from "compression";
import { Socket } from "net";
import { EventDispatcher, Injectable } from "quiver-framework";
import { Logger } from "../../logger/service/Logger";
import { HttpServerConfig } from "../config/HttpServerConfig";
import { HttpConnectionUpgradeEvent } from "../event/HttpConnectionUpgradeEvent";
import { UpgradeRequest } from "../data/UpgradeRequest";
import { HttpRequestHandler } from "../data/HttpRequestHandler";
import { HttpServerRouter } from "./HttpServerRouter";
import { RequestContext } from "../data/RequestContext";
import { Router } from "../data/Router";
import { HttpMethod } from "../data/HttpMethod";
import { isSingleRouter } from "../util/isSingleRouter";

@Injectable()
export class HttpServerService implements HttpServerRouter {

    readonly expressApp: Express;
    private readonly server: http.Server | https.Server;

    constructor(private readonly config: HttpServerConfig,
        private readonly logger: Logger,
        private readonly eventDispatcher: EventDispatcher
    ) {
        const { config: { port, httpsCredentials } } = this;

        this.expressApp = express();
        this.expressApp.use(bodyParser.json());
        this.expressApp.use(compression());

        if (!httpsCredentials) {
            this.server = http.createServer(this.expressApp);
        } else {
            const key = fs.readFileSync(httpsCredentials.privateKey, "utf8");
            const cert = fs.readFileSync(httpsCredentials.certificate, "utf8");
            this.server = https.createServer({ key, cert }, this.expressApp);
        }

        this.server.on("upgrade", this.upgradeListener);
        this.server.listen(port);
        this.server.once("listening", () => console.log(`Http${httpsCredentials ? 's' : ''} server running on port ${port}`));
    }

    private readonly upgradeListener = (req: UpgradeRequest, socket: Socket) => this.eventDispatcher.dispatchEvent(new HttpConnectionUpgradeEvent(req, socket));

    use(path: string, ...handlers: HttpRequestHandler[]): this;
    use(path: string, router: Router): this;
    use(path: string, ...param: HttpRequestHandler[] | [Router]): this {
        if (isSingleRouter(param)) {
            this.addRouter(path, param[0]);
        } else {
            this.expressApp.use(path, ...handlersToRequestContextFactory(param));
        }
        return this;
    }

    get(path: string, ...handlers: HttpRequestHandler[]) {
        this.expressApp.get(path, ...handlersToRequestContextFactory(handlers));
        return this;
    }

    post(path: string, ...handlers: HttpRequestHandler[]) {
        this.expressApp.post(path, ...handlersToRequestContextFactory(handlers));
        return this;
    }

    patch(path: string, ...handlers: HttpRequestHandler[]) {
        this.expressApp.patch(path, ...handlersToRequestContextFactory(handlers));
        return this;
    }

    put(path: string, ...handlers: HttpRequestHandler[]) {
        this.expressApp.put(path, ...handlersToRequestContextFactory(handlers));
        return this;
    }

    delete(path: string, ...handlers: HttpRequestHandler[]) {
        this.expressApp.delete(path, ...handlersToRequestContextFactory(handlers));
        return this;
    }

    private addRouter(path: string, { routes }: Router): void {
        for (const [method, handlerMap] of routes) {
            for (const [handlerPath, handlers] of handlerMap) {
                const mergedPath = `${path}${handlerPath.startsWith('/') ? '' : '/'}${handlerPath}`;
                switch (method) {
                    case "use":
                        this.use(mergedPath, ...handlers);
                        break;
                    case HttpMethod.GET:
                        this.get(mergedPath, ...handlers);
                        break;
                    case HttpMethod.POST:
                        this.post(mergedPath, ...handlers);
                        break;
                    case HttpMethod.PATCH:
                        this.patch(mergedPath, ...handlers);
                        break;
                    case HttpMethod.PUT:
                        this.put(mergedPath, ...handlers);
                        break;
                    case HttpMethod.DELETE:
                        this.delete(mergedPath, ...handlers);
                        break;
                }
            }
        }
    }
}

const requestContextFactory = (req: Request, res: Response, next: NextFunction) => new RequestContext(req, res, next);

const handlersToRequestContextFactory = (handlers: HttpRequestHandler[]) =>
    handlers.map(
        handler => (req: Request, res: Response, next: NextFunction) => handler(requestContextFactory(req, res, next))
    );
