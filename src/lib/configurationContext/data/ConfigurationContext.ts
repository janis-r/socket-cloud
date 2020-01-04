import {SocketConnectionType} from "../../types/SocketConnectionType";

export abstract class ConfigurationContext {
    // Unique id of configuration context
    id: string;
    // Maximum number of simultaneous connections
    maxConnectionCount?: number;
    // End-point address to send new connection data in order to validate new connection
    connectionValidationUrl?: string;
    // Allowed socket connection type - Websocket | Direct socket connection or both
    allowedSocketType?: SocketConnectionType | SocketConnectionType[];
    // Number in milliseconds within which to send ping messages to client.
    // No messages will be sent is value is set to 0 or key is not present.
    pingTimeout?: number;
    // Fragmentation directive for outgoing messages. No message fragmentation will be applied
    // if this property is absent.
    outgoingMessageFragmentSize?: number
}
