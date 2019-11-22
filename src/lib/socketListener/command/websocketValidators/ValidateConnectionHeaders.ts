import {Command, Inject} from "qft";
import {WebsocketConnectionValidationRequest} from "../../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../../logger";

export class ValidateConnectionHeaders implements Command<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;

    @Inject()
    private readonly logger: Logger;

    execute(): boolean {
        const {
            logger: {error},
            event: {
                request: {
                    headers: {
                        upgrade: upgradeHeader,
                        'sec-websocket-key': secWebSocketKeyHeader,
                        origin: originHeader,
                        'sec-websocket-origin': secWebsocketOriginHeader,
                        'sec-websocket-version': secWebsocketVersion
                    },
                },
                socket,
                requestInfo
            }
        } = this;

        if (!upgradeHeader || upgradeHeader !== "websocket") {
            error(`Websocket validation err - missing 'websocket' header`, requestInfo);
            socket.end('HTTP/1.1 400 Bad Request');
            return false;
        }

        if (!secWebSocketKeyHeader || typeof secWebSocketKeyHeader !== "string") {
            error(`Websocket validation err - missing 'sec-websocket-key' header`, requestInfo);
            // TODO: Add length check?
            // 5. A |Sec-WebSocket-Key| header field with a base64-encoded (see
            // Section 4 of [RFC4648]) value that, when decoded, is 16 bytes in
            // length.
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        if (!secWebsocketVersion) {
            error(`Websocket validation err - missing 'sec-websocket-version' header`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        if ((typeof secWebsocketVersion === "string" ? parseInt(secWebsocketVersion as string) : secWebsocketVersion) !== 13) {
            error(`Websocket validation err - 'sec-websocket-version' header must be equal 13`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        if (!originHeader && !secWebsocketOriginHeader) {
            error(`Websocket validation err - origin is not set in header`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        return true;
    }

}
