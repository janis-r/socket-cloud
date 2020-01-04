import {Inject, Injector} from "qft";
import {ConfigurationContext, ConfigurationContextProvider} from "../../configurationContext";
import {DataContextManager} from "./DataContextManager";

export class DataContextManagerProvider {

    @Inject()
    private readonly injector: Injector;

    @Inject()
    private readonly configurationContextProvider: ConfigurationContextProvider;

    private readonly entities = new Map<ContextId, DataContextManager>();

    readonly getContextManager = async (contextId: ContextId): Promise<DataContextManager> => {
        const {entities, configurationContextProvider: {getConfigurationContext}, injector} = this;

        if (!entities.has(contextId)) {
            const subInjector = injector.createSubInjector();
            subInjector.map(ConfigurationContext).toValue(await getConfigurationContext(contextId));
            entities.set(contextId, subInjector.instantiateInstance(DataContextManager))
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

type ContextId = ConfigurationContext['id'];
