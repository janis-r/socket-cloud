import * as http from "http";
import {IncomingMessage} from "http";
import {Socket} from "net";
import {EventDispatcher, Injectable} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContextProvider} from "../../configurationContext";
import {WebSocketListenerConfig} from "../config/WebSocketListenerConfig";
import {HttpStatusCode} from "../../types/HttpStatusCodes";
import {UpgradeRequest} from "../data/UpgradeRequest";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";

@Injectable()
export class WebsocketListener {

    private readonly httpServer: http.Server;

    constructor(private readonly config: WebSocketListenerConfig,
                private readonly logger: Logger,
                private readonly configurationContextProvider: ConfigurationContextProvider,
                private readonly eventDispatcher: EventDispatcher
    ) {
        this.httpServer = http.createServer((req, res) => {
            res.writeHead(HttpStatusCode.Ok, {"Content-Type": "text/plain"});
            res.end("Ready to accept connections.");
        });

        const {config: {webSocketPort}, socketConnectionHandler} = this;
        this.httpServer.on("upgrade", socketConnectionHandler);
        this.httpServer.listen(webSocketPort);
        this.httpServer.once("listening", () => logger.console(`WebSocketListener running on port ${webSocketPort}`));
    }

    private readonly socketConnectionHandler = async (request: UpgradeRequest, socket: Socket): Promise<void> => {
        const {eventDispatcher} = this;
        const {url, method, headers, connection: {remoteAddress}} = request;

        const requestInfo = {remoteAddress, url, method, headers};
        console.log('>>', {requestInfo});
        eventDispatcher.dispatchEvent(new WebsocketConnectionValidationRequest(
            request,
            socket,
            JSON.stringify(requestInfo, null, ' ')
        ));
    };
}

const getIpAddress = ({headers: {'x-forwarded-for': forwardedFor}, connection: {remoteAddress}}: IncomingMessage) => {
    if (forwardedFor && typeof forwardedFor === "string") {
        return forwardedFor.split(/\s*,\s*/)[0];
    }
    return remoteAddress;
};
