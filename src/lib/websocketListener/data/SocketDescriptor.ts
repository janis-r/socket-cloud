export type SocketDescriptor = {
    // Internal identifier of a connection.
    connectionId: string,
    // Remote address of a connection
    remoteAddress: string,
    // List of hosts described in x-forwarded-for header to identify originating IP address of a client connection
    forwardedFor?: string[],
    // IP address of a connection - either remote address or value from forwardedFor, if it's present.
    ipAddress: string,
    // Host address client is connecting to.
    host: string,
    // Exact client connection URL
    url: string,
    // Origin of connection declared via headers.
    origin?: string,
    // Websocket version
    websocketVersion: number
}
