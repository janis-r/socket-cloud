import * as http from "http";
import {IncomingMessage, Server} from "http";
import {Socket} from "net";
import {Injectable} from "qft";
import {WebSocketConfig} from "../config/WebSocketConfig";
import {Logger} from "../../logger";
import {createHash} from "crypto";

@Injectable()
export class WebSocketListener {

    constructor(private readonly config: WebSocketConfig,
                private readonly logger: Logger) {
        this.startListener();
    }


    private startListener(): void {
        const {config: {port}, logger: {error: logError, console: logToConsole}} = this;
        const delimiter = "\r\n";

        const server: Server = http.createServer((req, res) => {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end("Ready to accept connections.");
        });

        server.on("upgrade", (req: IncomingMessage, socket: Socket) => {
            const {
                url, method, headers,
                headers: {
                    upgrade: upgradeHeader,
                    'sec-websocket-key': webSocketKeyHeader
                },
                connection: {
                    remoteAddress
                }
            } = req;

            if (upgradeHeader !== "websocket") {
                logError(`WebSocketListener err - missing 'websocket' header`, JSON.stringify({
                    remoteAddress,
                    url,
                    method,
                    headers
                }, null, ' '));
                socket.end('HTTP/1.1 400 Bad Request');
                return;
            }

            if (!webSocketKeyHeader || typeof webSocketKeyHeader !== "string") {
                logError(`WebSocketListener err - missing 'sec-websocket-key' header`, JSON.stringify({
                    remoteAddress,
                    url,
                    method,
                    headers
                }, null, ' '));
                socket.end("HTTP/1.1 400 Bad Request");
                return;
            }

            const responseHeaders = [
                "HTTP/1.1 101 Web Socket Protocol Handshake",
                "Upgrade: WebSocket",
                "Connection: Upgrade",
                `Sec-WebSocket-Accept: ${generateAcceptValue(webSocketKeyHeader)}`
            ].join(delimiter);

            socket.write(responseHeaders + delimiter + delimiter);
        });

        server.listen(port);
        logToConsole(`WebSocketListener running on port ${port}`);
    }
}

const generateAcceptValue = (acceptKey: string) => createHash('sha1').update(`${acceptKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
