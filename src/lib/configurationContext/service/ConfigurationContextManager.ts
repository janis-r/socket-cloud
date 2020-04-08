import {ConfigurationContext, ConfigurationContextProvider, ContextId} from "..";

export abstract class ConfigurationContextManager extends ConfigurationContextProvider {
    /**
     * Update configuration context
     * @param context Configuration object to apply
     * @param isForwarded Indicate if this is forwarded call from other node - if value is true this instance
     * must push changes to external storage model, otherwise this is call to inform that some configuration have
     * changed.
     * @return boolean
     */
    abstract readonly updateConfiguration: (context: ConfigurationContext, isForwarded?: boolean) => Promise<boolean>;
    /**
     * Delete configuration context
     * @param id Context id to be deleted
     * @param isForwarded Indicate if this is forwarded call from other node - if value is true this instance
     * must push changes to external storage model, otherwise this is call to inform that some configuration have
     * changed.
     * @return boolean
     */
    abstract readonly deleteConfiguration: (id: ContextId, isForwarded?: boolean) => Promise<boolean>;

}

