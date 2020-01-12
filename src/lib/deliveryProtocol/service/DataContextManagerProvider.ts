import {Inject, Injector} from "qft";
import {ConfigurationContext, ConfigurationContextProvider, ContextId} from "../../configurationContext";
import {DataContextManager} from "./DataContextManager";

export class DataContextManagerProvider {

    @Inject()
    private readonly injector: Injector;

    @Inject()
    private readonly configurationContextProvider: ConfigurationContextProvider;

    private readonly entities = new Map<ContextId, DataContextManager>();
    private readonly entityPromise = new Map<ContextId, Promise<void>>();

    readonly getContextManager = async (contextId: ContextId): Promise<DataContextManager> => {
        const {entities, entityPromise, configurationContextProvider: {getConfigurationContext}, injector} = this;
        if (!entities.has(contextId) && entityPromise.has(contextId)) {
            await entityPromise.get(contextId);
        } else if (!entities.has(contextId)) {
            const promise = (async () => {
                const subInjector = injector.createSubInjector();
                subInjector.map(ConfigurationContext).toValue(await getConfigurationContext(contextId));
                entities.set(contextId, subInjector.instantiateInstance(DataContextManager));
            })();
            entityPromise.set(contextId, promise);
            await promise;
            entityPromise.delete(contextId);
        }

        return entities.get(contextId);
    };

    readonly resetContextManager = (contextId: ContextId) => {
        const {entities} = this;
        if (entities.has(contextId)) {
            entities.delete(contextId);
            return true;
        }
        return false;
    }
}
