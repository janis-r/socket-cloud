import {Inject} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContext} from "../data/ConfigurationContext";
import {SocketDescriptor} from "../../socketListener/data/SocketDescriptor";
import {SocketConnectionType} from "../../types/SocketConnectionType";

export class ConfigurationContextProvider {

    @Inject()
    private readonly logger: Logger;

    readonly getSocketConfigurationContext = async (descriptor: SocketDescriptor): Promise<ConfigurationContext | null> => {
        if (descriptor.type === SocketConnectionType.Direct) {
            // TODO: Implement direct socket configuration retrieval in here
            return null;
        }

        const {origin, remoteAddress} = descriptor;
        if (!origin) {
            return null;
        }

        const config: ConfigurationContext = {
            id: 'test',
            maxConnectionCount: 100,
            connectionValidationUrl: 'http://localhost:8000/validate-socket'
        };

        return config;
    };
}

