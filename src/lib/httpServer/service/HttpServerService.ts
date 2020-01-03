import * as http from "http";
import {Socket} from "net";
import {EventDispatcher, Injectable} from "qft";
import {Logger} from "../../logger";
import {HttpServerConfig} from "../config/HttpServerConfig";
import {HttpRequestEvent} from "../event/HttpRequestEvent";
import {HttpConnectionUpgradeEvent} from "../event/HttpConnectionUpgradeEvent";
import {UpgradeRequest} from "../data/UpgradeRequest";
import {IncomingMessage, ServerResponse} from "http";

@Injectable()
export class HttpServerService {

    private readonly httpServer: http.Server;

    constructor(private readonly config: HttpServerConfig,
                private readonly logger: Logger,
                private readonly eventDispatcher: EventDispatcher
    ) {
        const {config: {port}} = this;

        this.httpServer = http.createServer(this.requestListener);
        this.httpServer.on("upgrade", this.upgradeListener);
        this.httpServer.listen(port);
        this.httpServer.once("listening", () => logger.console(`Http server running on port ${port}`));
    }

    private readonly requestListener = (req: IncomingMessage, res: ServerResponse) => this.eventDispatcher.dispatchEvent(new HttpRequestEvent(req, res));
    private readonly upgradeListener = (req: UpgradeRequest, socket: Socket) => this.eventDispatcher.dispatchEvent(new HttpConnectionUpgradeEvent(req, socket));
}
