import {Inject} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContext} from "../data/ConfigurationContext";
import {SocketDescriptor} from "../../websocketListener/data/SocketDescriptor";
import {SocketConnectionType} from "../../types/SocketConnectionType";

export class ConfigurationContextProvider {

    @Inject()
    private readonly logger: Logger;

    private readonly knownContexts = new Map<ConfigurationContext['id'], ConfigurationContext>([
        ['test', {
            id: 'test',
            maxConnectionCount: 100,
            connectionValidationUrl: 'http://localhost:8000/validate-socket',
            pingTimeout: 30000,
            outgoingMessageFragmentSize: 2 ** 14 // 16 kb
        }]
    ]);

    readonly getSocketConfigurationContext = async (descriptor: SocketDescriptor): Promise<ConfigurationContext | null> => {
        const {knownContexts} = this;

        if (descriptor.type === SocketConnectionType.Direct) {
            // TODO: Implement socket configuration retrieval in here
            return null;
        }

        const {origin} = descriptor;
        if (!origin) {
            return null;
        }

        return knownContexts.get('test') ?? null;
    };

    readonly getConfigurationContext = async (id: ConfigurationContext['id']): Promise<ConfigurationContext | null> => {
        const {knownContexts} = this;
        return knownContexts.get(id) ?? null;
    };
}

