import * as http from "http";
import {Socket} from "net";
import {createHash} from "crypto";
import {EventDispatcher, Injectable} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContextProvider} from "../../configurationContext";
import {WebSocketListenerConfig} from "../config/WebSocketListenerConfig";
import {HttpStatusCode} from "../../types/HttpStatusCodes";
import {WebsocketUpgradeRequest} from "../data/WebsocketUpgradeRequest";
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

    private readonly socketConnectionHandler = async (request: WebsocketUpgradeRequest, socket: Socket): Promise<void> => {
        const {eventDispatcher} = this;
        const {connection: {remoteAddress}, url, method, headers} = request;

        console.log('>>', {remoteAddress, url, method, headers}, '\n');

        eventDispatcher.dispatchEvent(new WebsocketConnectionValidationRequest(
            request,
            socket,
            JSON.stringify({remoteAddress, url, method, headers}, null, ' ')
        ));

        /*return;

        //TODO: store `host` somewhere

        console.log({method, url}, '\n');
        console.log('>> parseWebsocketExtensions', parseWebsocketExtensions(secWebsocketExtensions));

        process.exit();
        // The request MUST include a header field with the name
        // |Sec-WebSocket-Version|. The value of this header field MUST be
        // 13.

        const debugInfo = JSON.stringify({remoteAddress, url, method, headers}, null, ' ');

        if (!upgradeHeader || upgradeHeader !== "websocket") {
            logError(`WebSocketListener err - missing 'websocket' header`, debugInfo);
            socket.end('HTTP/1.1 400 Bad Request');
            return;
        }

        if (!secWebSocketKeyHeader || typeof secWebSocketKeyHeader !== "string") {
            logError(`WebSocketListener err - missing 'sec-websocket-key' header`, debugInfo);
            // TODO: Add length check?
            // 5. A |Sec-WebSocket-Key| header field with a base64-encoded (see
            // Section 4 of [RFC4648]) value that, when decoded, is 16 bytes in
            // length.
            socket.end("HTTP/1.1 400 Bad Request");
            return;
        }

        if (!secWebsocketVersion || typeof secWebsocketVersion !== "string") {

        }
        const origin = originHeader ?? secWebsocketOriginHeader;
        if (!origin) {
            logError(`WebsocketListener err - missing origin info in header`, debugInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return;
        }

        const socketDescriptor: SocketDescriptor = {type: SocketConnectionType.WebSocket, origin, remoteAddress};
        const configuration = await getSocketConfigurationContext(socketDescriptor);
        if (configuration === null) {
            logError(`WebsocketListener err - configuration context cannot not be found`, debugInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return;
        }

        const validationEvent = new ValidateSocketConnectionEvent(socketDescriptor, configuration);
        eventDispatcher.dispatchEvent(validationEvent);
        const validationResponse = await validationEvent.validate();
        if (validationResponse !== true) {
            logDebug(`WebSocketListener new connection prevented with reason: ${validationResponse}`, debugInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return;
        }

        if (!socket.writable && !socket.readable) {
            logDebug(`WebSocketListener new connection closed before init process is finished`, debugInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return;
        }

        const delimiter = "\r\n";
        const responseHeaders = [
            "HTTP/1.1 101 Web Socket Protocol Handshake",
            "Upgrade: WebSocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${generateWebSocketAcceptResponse(secWebSocketKeyHeader)}`,
            // 'Sec-WebSocket-Extensions: permessage-deflate'
        ].join(delimiter);

        socket.write(responseHeaders + delimiter + delimiter);

        const connection = new ClientConnection(socket);

        eventDispatcher.dispatchEvent(new NewSocketConnectionEvent(socket, socketDescriptor, configuration));
        */
    };
}

const generateWebSocketAcceptResponse = (acceptKey: string) => createHash('sha1').update(`${acceptKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
