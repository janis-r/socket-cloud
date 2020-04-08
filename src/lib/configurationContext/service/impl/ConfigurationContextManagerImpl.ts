import {Inject} from "quiver-framework";
import {ConfigurationContext, ConfigurationContextModel, ContextId} from "../..";
import {ConfigurationContextManager} from "../ConfigurationContextManager";

export class ConfigurationContextManagerImpl implements ConfigurationContextManager {

    private contextCache = new Map<ContextId, ConfigurationContext>();

    @Inject()
    private readonly contextModel: ConfigurationContextModel;

    /**
     * Get configuration context by context id
     */
    readonly getConfigurationContext = async (id: ContextId) => {
        const {contextCache, contextModel} = this;
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

    readonly updateConfiguration = async (context: ConfigurationContext, isForwarded = false): Promise<boolean> => {
        const {contextCache, contextModel} = this;
        const {id} = context;

        let contextUpdated: boolean = false;
        if (!isForwarded) {
            const existing = await contextModel.getConfiguration(id);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(context)) {
                await contextModel.saveConfiguration(context);
                contextUpdated = true;
            }
        } else if (contextCache.has(id) && JSON.stringify(contextCache.get(id)) !== JSON.stringify(context)) {
            contextCache.set(id, context);
            contextUpdated = true;
        }
        return contextUpdated;

    };

    readonly deleteConfiguration = async (id: ContextId, isForwarded = false): Promise<boolean> => {
        const {contextCache, contextModel} = this;
        let contextFound: boolean;
        if (!isForwarded) {
            contextFound = await contextModel.deleteConfiguration(id);
        } else {
            contextFound = contextCache.has(id);
        }

        contextCache.delete(id);
        return contextFound;
    }
}
