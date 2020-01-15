import {Inject} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContext} from "../data/ConfigurationContext";
import {SocketDescriptor} from "../../websocketListener/data/SocketDescriptor";
import {protocolName} from "../../deliveryProtocol";

export class ConfigurationContextProvider {

    @Inject()
    private readonly logger: Logger;

    private readonly knownContexts = new Map<ConfigurationContext['id'], ConfigurationContext>([
        ['test', {
            id: 'test',
            protocol: protocolName,
            maxConnectionCount: 100,
            validationApi: {
                url: 'http://localhost:8001/validationAPI',
                validateNewConnections: true
            },
            pingTimeout: 30000,
            outgoingMessageFragmentSize: 2 ** 14 // 16 kb
        }]
    ]);

    readonly getSocketConfigurationContext = async (descriptor: SocketDescriptor): Promise<ConfigurationContext | null> => {
        const {knownContexts} = this;

        const {origin} = descriptor;
        if (!origin) {
            return null;
        }

        return knownContexts.get('test') ?? null;
    };

    readonly getConfigurationContext = async (id: ConfigurationContext['id']): Promise<Readonly<ConfigurationContext> | null> => {
        const {knownContexts} = this;
        return knownContexts.get(id) ?? null;
    };
}

