const {env: {SOCKET_PORT}} = process;

export abstract class SocketListenerConfig {
    readonly socketPort? = SOCKET_PORT ? parseInt(SOCKET_PORT) : 8002;
}
