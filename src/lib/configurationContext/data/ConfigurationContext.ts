import {SocketConnectionType} from "../../types/SocketConnectionType";

export type ConfigurationContext = Readonly<{
    id: string;
    maxConnectionCount?: number;
    connectionValidationUrl?: string;
    allowedSocketType?: SocketConnectionType | SocketConnectionType[];
    // Number in milliseconds within which to send ping messages to client.
    // No messages will be sent is value is set to 0 or key is not present.
    pingTimeout?: number;
}>;
