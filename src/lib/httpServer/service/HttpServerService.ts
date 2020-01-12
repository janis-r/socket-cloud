import * as http from "http";
import * as https from "https";
import express, {Express, NextFunction, Request, Response} from "express";
import fs from "fs";
import {json} from "body-parser";
import compression from "compression";
import {Socket} from "net";
import {EventDispatcher, Injectable} from "qft";
import {Logger} from "../../logger";
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
        this.expressApp.use(json());
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
        this.server.once("listening", () => logger.console(`Http${httpsCredentials ? 's' : ''} server running on port ${port}`));
    }

    private readonly upgradeListener = (req: UpgradeRequest, socket: Socket) => this.eventDispatcher.dispatchEvent(new HttpConnectionUpgradeEvent(req, socket));

    get(url: string, handler: HttpRequestHandler): void {
        this.expressApp.get(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }

    post(url: string, handler: HttpRequestHandler): void {
        this.expressApp.post(url, (req, res, next) => handler(requestContextFactory(req, res, next)));
    }
}

const requestContextFactory = (req: Request, res: Response, next: NextFunction) => new RequestContext(req, res, next);
