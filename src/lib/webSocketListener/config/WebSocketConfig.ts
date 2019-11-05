const {env: {WEB_SOCKET_PORT}} = process;

/**
 * Web socket
 */
export abstract class WebSocketConfig {
    readonly port = WEB_SOCKET_PORT ? parseInt(WEB_SOCKET_PORT) : 8001;
}
