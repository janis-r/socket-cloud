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
    abstract saveConfiguration(context: ConfigurationContext): Promise<boolean>;

    /**
     * Retrieve configuration context.
     * @param contextId
     */
    abstract getConfiguration(contextId: ContextId): Promise<ConfigurationContext | null>;

    /**
     * Delete configuration context.
     * @param contextId
     */
    abstract deleteConfiguration(contextId: ContextId): Promise<boolean>;
}
