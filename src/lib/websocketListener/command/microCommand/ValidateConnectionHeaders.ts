import { Command, Inject } from "quiver-framework";
import { WebsocketConnectionValidationRequest } from "../../event/WebsocketConnectionValidationRequest";
import { Logger } from "../../../logger/service/Logger";

export class ValidateConnectionHeaders implements Command<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;

    @Inject()
    private readonly logger: Logger;

    execute() {
        const {
            logger: { error },
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

        if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
            error(`Websocket validation err - missing 'websocket' header`, requestInfo);
            socket.end('HTTP/1.1 400 Bad Request');
            return false;
        }

        if (!secWebSocketKeyHeader || typeof secWebSocketKeyHeader !== "string") {
            error(`Websocket validation err - missing 'sec-websocket-key' header`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        if (Buffer.from(secWebSocketKeyHeader, "base64").length !== 16) {
            error(`Websocket validation err - 'sec-websocket-key' header is of wrong format`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        if (!secWebsocketVersion) {
            error(`Websocket validation err - missing 'sec-websocket-version' header`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        if ((typeof secWebsocketVersion === "string" ? parseInt(secWebsocketVersion) : secWebsocketVersion) !== 13) {
            error(`Websocket validation err - 'sec-websocket-version' header must be equal 13`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        return true;
    }

}
