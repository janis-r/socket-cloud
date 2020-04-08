import {ConfigurationContext} from "../data/ConfigurationContext";
import {ContextId} from "..";

export abstract class ConfigurationContextProvider {

    /**
     * Get configuration context by context id
     */
    readonly getConfigurationContext: (contextId: ContextId) => Promise<Readonly<ConfigurationContext> | null>;
}

