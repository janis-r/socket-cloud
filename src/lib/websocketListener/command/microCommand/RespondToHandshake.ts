import {Command, Inject} from "qft";
import {WebsocketConnectionValidationRequest} from "../../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../../logger";
import {handshakeResponse} from "../../util/handshakeResponse";

export class RespondToHandshake implements Command<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;

    @Inject()
    private readonly logger: Logger;

    execute() {
        const {
            logger: {debug},
            event: {
                request: {
                    headers: {'sec-websocket-key': secWebSocketKeyHeader}
                },
                socket, requestInfo, extensions
            }
        } = this;

        if (!socket.writable && !socket.readable) {
            debug(`WebSocketListener new connection closed before init process is finished`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return false;
        }

        const delimiter = "\r\n";
        const responseHeaders = [
            `HTTP/1.1 101 Web Socket Protocol Handshake`,
            `Upgrade: WebSocket`,
            `Connection: Upgrade`,
            `Sec-WebSocket-Accept: ${handshakeResponse(secWebSocketKeyHeader)}`
        ];

        // console.log({extensions})
        // process.exit();

        if (extensions && extensions.length > 0) {
            responseHeaders.push('Sec-WebSocket-Extensions: ' + extensions.map(({configOfferResponse}) => configOfferResponse).join(", "))
            // responseHeaders.push('Sec-WebSocket-Extensions: permessage-deflate;client_no_context_takeover;client_max_window_bits=15')
        }

        console.info('>> responseHeaders:', responseHeaders);
        socket.write(responseHeaders.join(delimiter) + delimiter + delimiter);

        return true;
    }

}