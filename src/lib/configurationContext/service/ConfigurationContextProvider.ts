import { Inject } from "quiver-framework";
import { ConfigurationContext } from "../data/ConfigurationContext";
import { ContextId } from "../data/ContextId";
import { ConfigurationContextModel } from "../model/ConfigurationContextModel";

/**
 * App level goto place for configuration context data.
 * This class is doing informed caching of data so we don't have to punch data storage each time configuration
 * context data is required.
 */
export class ConfigurationContextProvider {

    private readonly contextCache = new Map<ContextId, ConfigurationContext>();

    @Inject()
    private readonly contextModel: ConfigurationContextModel;

    /**
     * Get configuration context by context id
     */
    readonly getConfigurationContext = async (id: ContextId): Promise<ConfigurationContext | null> => {
        const { contextCache, contextModel } = this;
        if (contextCache.has(id)) {
            return contextCache.get(id);
        }

        const context = await contextModel.getConfiguration(id);
        if (context) {
            contextCache.set(id, context);
            return context;
        }

        return null;
    };

    /**
     * Delete cached version of context data.
     * This will clear it for good until next time some instance request it and it's refreshed from external storage.
     * @param id
     */
    readonly resetConfiguration = (id: ContextId) => this.contextCache.delete(id);
}

