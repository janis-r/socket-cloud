const {env: {WEB_SOCKET_PORT}} = process;

export abstract class WebSocketListenerConfig {
    readonly webSocketPort? = WEB_SOCKET_PORT ? parseInt(WEB_SOCKET_PORT) : 8001;
}
