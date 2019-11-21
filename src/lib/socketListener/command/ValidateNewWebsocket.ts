import {Inject, MacroCommand, SubCommand, EventDispatcher} from "qft";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../logger";
import {AuthorizeConnectionContext} from "./websocketValidators/AuthorizeConnectionContext";
import {ValidateConnectionHeaders} from "./websocketValidators/ValidateConnectionHeaders";
import {generateWebsocketHandshakeResponse} from "../util/websocket-utils";
import {NewSocketConnectionEvent} from "../event/NewSocketConnectionEvent";
import {ClientConnection} from "../model/ClientConnection";

export class ValidateNewWebsocket extends MacroCommand<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;
    @Inject()
    private readonly logger: Logger;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;

    constructor() {
        super([
            ValidateConnectionHeaders,
            AuthorizeConnectionContext
        ]);
    }

    async execute(): Promise<void> {
        await super.execute();

        const {
            event: {
                request: {
                    headers: {'sec-websocket-key': secWebSocketKeyHeader},
                    socket
                },
                requestInfo, socketDescriptor, configurationContext
            },
            logger: {debug},
            eventDispatcher
        } = this;

        if (this.executionIsHalted) {
            debug(`ValidateNewWebsocket halted with err`, requestInfo);
            return;
        }

        if (!socket.writable && !socket.readable) {
            debug(`WebSocketListener new connection closed before init process is finished`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return;
        }

        const delimiter = "\r\n";
        const responseHeaders = [
            "HTTP/1.1 101 Web Socket Protocol Handshake",
            "Upgrade: WebSocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${generateWebsocketHandshakeResponse(secWebSocketKeyHeader)}`,
            // 'Sec-WebSocket-Extensions: permessage-deflate'
        ].join(delimiter);

        socket.write(responseHeaders + delimiter + delimiter);

        const connection = new ClientConnection(socket);

        eventDispatcher.dispatchEvent(new NewSocketConnectionEvent(socket, socketDescriptor, configurationContext));

    }

    protected async executeSubCommand(command: SubCommand<boolean>): Promise<boolean> {
        const result = await super.executeSubCommand(command);
        if (!result) {
            console.log('Halt ValidateNewWebsocket at', command);
            this.haltExecution();
        }
        return result;
    }

}
