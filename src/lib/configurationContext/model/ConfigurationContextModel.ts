import { ConfigurationContext } from "../data/ConfigurationContext";
import { ContextId } from "../data/ContextId";

/**
 * Data model that abstracts retrieval and saving of configuration context into external storage,
 * whatever implemented.
 */
export abstract class ConfigurationContextModel {
    /**
     * Save configuration context
     * @param context
     */
    abstract readonly saveConfiguration: (context: ConfigurationContext) => Promise<boolean>;

    /**
     * Retrieve configuration context.
     * @param contextId
     */
    abstract readonly getConfiguration: (contextId: ContextId) => Promise<ConfigurationContext | null>;

    /**
     * Delete configuration context.
     * @param contextId
     */
    abstract readonly deleteConfiguration: (contextId: ContextId) => Promise<boolean>;
}
