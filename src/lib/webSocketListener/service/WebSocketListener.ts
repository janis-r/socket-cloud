import * as http from "http";
import {IncomingMessage} from "http";
import {Socket} from "net";
import {createHash} from "crypto";
import {EventDispatcher, Injectable} from "qft";
import {WebSocketListenerConfig} from "../config/WebSocketListenerConfig";
import {Logger} from "../../logger";
import {ConfigurationContextProvider} from "../../configurationContext";
import {NewWebSocketConnectionEvent} from "../event/NewWebSocketConnectionEvent";

@Injectable()
export class WebSocketListener {

    private readonly httpServer: http.Server;

    constructor(private readonly config: WebSocketListenerConfig,
                private readonly logger: Logger,
                private readonly configurationContextProvider: ConfigurationContextProvider,
                private readonly eventDispatcher: EventDispatcher
    ) {
        this.httpServer = http.createServer((req, res) => {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end("Ready to accept connections.");
        });
        this.httpServer.on("upgrade", this.socketConnectionHandler);
        this.httpServer.listen(config.port);
        logger.console(`WebSocketListener running on port ${config.port}`);
    }

    private readonly socketConnectionHandler = async (request: IncomingMessage, socket: Socket): Promise<void> => {
        const {
            logger: {error: logError, debug: logDebug},
            configurationContextProvider: {getConfigurationForWebSocket},
            eventDispatcher
        } = this;
        const {
            url, method, headers,
            headers: {
                upgrade: upgradeHeader,
                'sec-websocket-key': secWebSocketKeyHeader,
                origin: originHeader,
                'sec-websocket-origin': secWebsocketOriginHeader
            },
            connection: {remoteAddress}
        } = request;

        console.log(headers);

        const debugInfo = JSON.stringify({remoteAddress, url, method, headers}, null, ' ');

        if (upgradeHeader !== "websocket") {
            logError(`WebSocketListener err - missing 'websocket' header`, debugInfo);
            socket.end('HTTP/1.1 400 Bad Request');
            return;
        }

        if (!secWebSocketKeyHeader || typeof secWebSocketKeyHeader !== "string") {
            logError(`WebSocketListener err - missing 'sec-websocket-key' header`, debugInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return;
        }

        const origin = secWebsocketOriginHeader as string ?? originHeader as string;
        const configuration = await getConfigurationForWebSocket(remoteAddress, origin);
        if (configuration === null) {
            logError(`WebSocketListener err - missing configuration context`, debugInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return;
        }

        const validationEvent = new NewWebSocketConnectionEvent(origin, remoteAddress, configuration);
        eventDispatcher.dispatchEvent(validationEvent);
        if (validationEvent.defaultPrevented) {
            logDebug(`WebSocketListener new connection prevented with reason: ${validationEvent.preventReason}`, debugInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return;
        }

        const delimiter = "\r\n";
        const responseHeaders = [
            "HTTP/1.1 101 Web Socket Protocol Handshake",
            "Upgrade: WebSocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${generateWebSocketAcceptResponse(secWebSocketKeyHeader)}`
        ].join(delimiter);

        socket.write(responseHeaders + delimiter + delimiter);
    };
}

const generateWebSocketAcceptResponse = (acceptKey: string) => createHash('sha1').update(`${acceptKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
