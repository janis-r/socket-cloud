import {SocketConnectionType} from "../../types/SocketConnectionType";

export type SocketDescriptor = {
    type: SocketConnectionType.Direct,
    remoteAddress: string
} | WebsocketDescriptor;

export type WebsocketDescriptor = {
    type: SocketConnectionType.WebSocket,
    connectionId: string,
    remoteAddress: string,
    host: string,
    origin: string,
    websocketVersion: number,
    forwardedFor: string | null,
    url: string | null
}
