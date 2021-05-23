import { Command, EventDispatcher, Inject } from "quiver-framework";
import { SocketDescriptor } from "../../data/SocketDescriptor";
import { ValidateSocketConnectionEvent } from "../../event/ValidateSocketConnectionEvent";
import { WebsocketConnectionValidationRequest } from "../../event/WebsocketConnectionValidationRequest";
import { Logger } from "../../../logger/service/Logger";
import { ConfigurationContextProvider } from "../../../configurationContext/service/ConfigurationContextProvider";
import url from "url";

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
            event,
            event: {
                request: {
                    headers: {
                        origin: originHeader,
                        host,
                        'sec-websocket-key': secWebSocketKeyHeader,
                        'sec-websocket-origin': secWebsocketOriginHeader,
                        'x-forwarded-for': xForwardedForHeader,
                        'sec-websocket-version': websocketVersion
                    },
                    connection: { remoteAddress },
                    socket,
                    url
                },
                requestInfo
            },
            logger: { error, debug },
            eventDispatcher,
            configurationContextProvider: { getConfigurationContext }
        } = this;

        const forwardedFor = xForwardedForHeader ? xForwardedForHeader.split(",") : null;
        const ipAddress = forwardedFor && forwardedFor.length ? forwardedFor[0] : remoteAddress;
        const origin = originHeader ?? secWebsocketOriginHeader;

        const socketDescriptor: SocketDescriptor = {
            connectionId: secWebSocketKeyHeader,
            remoteAddress,
            ipAddress,
            host,
            url,
            websocketVersion: parseInt(websocketVersion)
        };
        if (forwardedFor) {
            socketDescriptor.forwardedFor = forwardedFor;
        }
        if (origin) {
            socketDescriptor.origin = origin;
        }

        const contextId = extractContextIdFromUrl(socketDescriptor.url);
        if (!contextId) {
            // TODO: Fallback to default configuration context could be in use here
            error(`WebsocketListener err - configuration context id not found in url`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return false;
        }

        const configuration = await getConfigurationContext(contextId);
        if (configuration === null) {
            error(`WebsocketListener err - configuration context cannot not be found`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return false;
        }

        const validationEvent = new ValidateSocketConnectionEvent(socketDescriptor, configuration);
        eventDispatcher.dispatchEvent(validationEvent);
        const validationResponse = await validationEvent.validate();

        if (validationResponse !== true) {
            debug(`WebSocketListener new connection prevented with reason: ${JSON.stringify(validationResponse)}`, requestInfo);
            socket.end("HTTP/1.1 403 Forbidden");
            return false;
        }

        event.socketDescriptor = socketDescriptor;
        event.configurationContext = configuration;
        if (validationEvent.operatorData) {
            event.operatorData = validationEvent.operatorData;
        }

        return true;
    }
}

function extractContextIdFromUrl(connectionUrl: string): string | null {
    const { pathname } = url.parse(connectionUrl, true);
    const contextId = pathname.replace("/", "");
    if (!contextId) {
        return null;
    }
    return contextId;
}

