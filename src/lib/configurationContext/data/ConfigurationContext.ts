import {SocketConnectionType} from "../../types/SocketConnectionType";

export type ConfigurationContext = Readonly<{
    id: string;
    maxConnectionCount?: number;
    connectionValidationUrl?: string;
    allowedSocketType?: SocketConnectionType | SocketConnectionType[];
}>;
