import {ConfigurationContext} from "../data/ConfigurationContext";
import {SocketDescriptor} from "../../websocketListener/data/SocketDescriptor";
import {ContextId} from "..";

export abstract class ConfigurationContextProvider {
    /**
     * Get configuration context for a socket connection
     */
    abstract readonly getSocketConfigurationContext: (descriptor: SocketDescriptor) => Promise<ConfigurationContext | null>;
    /**
     * Get configuration context by context id
     */
    abstract readonly getConfigurationContext: (id: ContextId) => Promise<Readonly<ConfigurationContext> | null>;
}

