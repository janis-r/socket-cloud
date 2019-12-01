import {Command, EventDispatcher, Inject} from "qft";
import {SocketDescriptor} from "../../data/SocketDescriptor";
import {SocketConnectionType} from "../../../types/SocketConnectionType";
import {ValidateSocketConnectionEvent} from "../..";
import {WebsocketConnectionValidationRequest} from "../../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../../logger";
import {ConfigurationContextProvider} from "../../../configurationContext";

export class AuthorizeConnectionContext implements Command<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;
    @Inject()
    private readonly logger: Logger;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;
    @Inject()
    private readonly configurationContextProvider: ConfigurationContextProvider;

    async execute() {

        const {
            event: {
                request: {
                    headers: {
                        origin: originHeader,
                        host,
                        'sec-websocket-key': secWebSocketKeyHeader,
                        'sec-websocket-origin': secWebsocketOriginHeader,
                        'x-forwarded-for': forwardedFor,
                        'sec-websocket-version': websocketVersion
                    },
                    connection: {remoteAddress},
                    socket,
                    url
                },
                requestInfo
            },
            logger: {error, debug},
            eventDispatcher,
            configurationContextProvider: {getSocketConfigurationContext}
        } = this;

        const socketDescriptor: SocketDescriptor = {
            type: SocketConnectionType.WebSocket,
            connectionId: <string>secWebSocketKeyHeader,
            host,
            origin: originHeader ?? secWebsocketOriginHeader,
            remoteAddress,
            websocketVersion: parseInt(websocketVersion as string),
            forwardedFor: forwardedFor && typeof forwardedFor === "string" ? forwardedFor : null,
            url: url && url.replace(/\/|\//g, '').length > 0 ? url : null
        };

        const configuration = await getSocketConfigurationContext(socketDescriptor);
        if (configuration === null) {
            error(`WebsocketListener err - configuration context cannot not be found`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return false;
        }

        const validationEvent = new ValidateSocketConnectionEvent(socketDescriptor, configuration);
        eventDispatcher.dispatchEvent(validationEvent);
        const validationResponse = await validationEvent.validate();

        if (validationResponse !== true) {
            debug(`WebSocketListener new connection prevented with reason: ${validationResponse}`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return false;
        }

        this.event.socketDescriptor = socketDescriptor;
        this.event.configurationContext = configuration;

        return true;
    }
}
