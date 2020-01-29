import {Inject} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContext} from "../data/ConfigurationContext";
import {SocketDescriptor} from "../../websocketListener/data/SocketDescriptor";
import {pocmddpProtocol} from "../../deliveryProtocol";
import {toMilliseconds} from "ugd10a";
import url from "url";
import {ContextId} from "..";

export class ConfigurationContextProvider {

    @Inject()
    private readonly logger: Logger;

    private readonly knownContexts = new Map<ContextId, ConfigurationContext>([
        ['tests-runner', {
            id: 'tests-runner',
            protocol: pocmddpProtocol,
            validationApi: {
                url: 'http://localhost:8001/validationAPI',
                validateNewConnections: true
            },
            pingTimeout: toMilliseconds(30, "seconds"),
            outgoingMessageFragmentSize: 2 ** 14, // 16 kb,
            channelConfig: {
                "cached-channel": {
                    cachingPolicy: {
                        maxCacheSize: 100
                    }
                }
            }
        }]
    ]);

    readonly getSocketConfigurationContext = async (descriptor: SocketDescriptor): Promise<ConfigurationContext | null> => {
        const {knownContexts} = this;

        const {origin} = descriptor;
        /*if (!origin) { // TODO: At some point web origin might be only one accepted, then checking for origin in header would make sense
            return null;
        }*/

        const {pathname} = url.parse(descriptor.url, true);
        const match = pathname.match(/^\/?([^\/]+)/);
        if (!match || match.length < 2) {
            return null;
        }

        const contextId = match[1];
        return knownContexts.get(contextId.toLowerCase()) ?? null;
    };

    readonly getConfigurationContext = async (id: ConfigurationContext['id']): Promise<Readonly<ConfigurationContext> | null> => {
        const {knownContexts} = this;
        return knownContexts.get(id) ?? null;
    };
}

