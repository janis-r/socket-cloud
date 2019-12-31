import * as http from "http";
import {Socket} from "net";
import {EventDispatcher, Injectable} from "qft";
import {Logger} from "../../logger";
import {HttpServerConfig} from "../config/HttpServerConfig";
import {HttpRequestEvent} from "../event/HttpRequestEvent";
import {HttpConnectionUpgradeEvent} from "../event/HttpConnectionUpgradeEvent";
import {UpgradeRequest} from "../data/UpgradeRequest";

@Injectable()
export class HttpServerService {

    private readonly httpServer: http.Server;

    constructor(private readonly config: HttpServerConfig,
                private readonly logger: Logger,
                private readonly eventDispatcher: EventDispatcher
    ) {
        const {config: {port}} = this;

        this.httpServer = http.createServer((req, res) => {
            eventDispatcher.dispatchEvent(new HttpRequestEvent(req, res));
        });
        this.httpServer.on("upgrade", (req: UpgradeRequest, socket: Socket) => {
            eventDispatcher.dispatchEvent(new HttpConnectionUpgradeEvent(req, socket));
        });
        this.httpServer.listen(port);
        this.httpServer.once("listening", () => logger.console(`WebSocketListener running on port ${port}`));
    }

}
