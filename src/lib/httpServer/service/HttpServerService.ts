import * as http from "http";
import * as https from "https";
import express, {Express, NextFunction, Request, Response} from "express";
import fs from "fs";
import bodyParser from "body-parser";
import compression from "compression";
import {Socket} from "net";
import {EventDispatcher, Injectable} from "quiver-framework";
import {Logger} from "../../logger/service/Logger";
import {HttpServerConfig} from "../config/HttpServerConfig";
import {HttpConnectionUpgradeEvent} from "../event/HttpConnectionUpgradeEvent";
import {UpgradeRequest} from "../data/UpgradeRequest";
import {HttpRequestHandler} from "../data/HttpRequestHandler";
import {HttpServerRouter} from "./HttpServerRouter";
import {RequestContext} from "../data/RequestContext";

@Injectable()
export class HttpServerService implements HttpServerRouter {

    readonly expressApp: Express;
    private readonly server: http.Server | https.Server;

    constructor(private readonly config: HttpServerConfig,
                private readonly logger: Logger,
                private readonly eventDispatcher: EventDispatcher
    ) {
        const {config: {port, httpsCredentials}} = this;

        this.expressApp = express();
        this.expressApp.use(bodyParser.json());
        this.expressApp.use(compression());

        if (!httpsCredentials) {
            this.server = http.createServer(this.expressApp);
        } else {
            const key = fs.readFileSync(httpsCredentials.privateKey, "utf8");
            const cert = fs.readFileSync(httpsCredentials.certificate, "utf8");
            this.server = https.createServer({key, cert}, this.expressApp);
        }

        this.server.on("upgrade", this.upgradeListener);
        this.server.listen(port);
        this.server.once("listening", () => console.log(`Http${httpsCredentials ? 's' : ''} server running on port ${port}`));
    }

    private readonly upgradeListener = (req: UpgradeRequest, socket: Socket) => this.eventDispatcher.dispatchEvent(new HttpConnectionUpgradeEvent(req, socket));

    use(url: string, handler: HttpRequestHandler): void {
        this.expressApp.use(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }

    get(url: string, handler: HttpRequestHandler): void {
        this.expressApp.get(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }

    post(url: string, handler: HttpRequestHandler): void {
        this.expressApp.post(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }

    patch(url: string, handler: HttpRequestHandler): void {
        this.expressApp.patch(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }

    put(url: string, handler: HttpRequestHandler): void {
        this.expressApp.put(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }

    delete(url: string, handler: HttpRequestHandler): void {
        this.expressApp.delete(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }
}

const requestContextFactory = (req: Request, res: Response, next: NextFunction) => new RequestContext(req, res, next);
