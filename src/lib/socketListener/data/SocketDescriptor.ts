import {SocketConnectionType} from "../../types/SocketConnectionType";

export type SocketDescriptor = Readonly<{
    type: SocketConnectionType.Direct,
    remoteAddress: string
} | {
    type: SocketConnectionType.WebSocket,
    remoteAddress: string,
    origin: string
}>;
