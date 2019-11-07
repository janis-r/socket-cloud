const {env: {WEB_SOCKET_PORT}} = process;

/**
 * Default configuration of WebSocket connection listener
 */
export abstract class WebSocketListenerConfig {
    readonly port = WEB_SOCKET_PORT ? parseInt(WEB_SOCKET_PORT) : 8001;
}
