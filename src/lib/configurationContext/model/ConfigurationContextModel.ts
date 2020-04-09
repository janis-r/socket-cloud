/**
 * Data model that abstracts retrieval and saving of configuration context into external storage,
 * whatever implemented.
 */
import {ConfigurationContext, ContextId} from "..";

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
