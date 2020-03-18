import {toMilliseconds} from "ugd10a";
import url from "url";
import {ConfigurationContextProvider} from "../ConfigurationContextProvider";
import {ConfigurationContext, ContextId} from "../..";
import {defaultProtocolId} from "@defaultProtocol/data/defaultProtocolId";
import {SocketDescriptor} from "../../../websocketListener/data/SocketDescriptor";

const defaultContext: ConfigurationContext = {
    id: "default-dev-context",
    protocol: defaultProtocolId
};

const customContext: Record<string, ConfigurationContext> = {
    "tests-runner": {
        id: "tests-runner",
        protocol: defaultProtocolId,
        validationApi: {
            url: "http://localhost:8001/validationAPI",
            validateNewConnections: true
        },
        pingTimeout: toMilliseconds(30, "seconds"),
        outgoingMessageFragmentSize: 2 ** 14, // 16 kb,
        channelConfig: {
            "cached-channel": {
                cachingPolicy: {
                    cacheSize: 100
                }
            }
        }
    }

};


export class DevServerContextProvider implements ConfigurationContextProvider {

    readonly getSocketConfigurationContext = async ({url: connectionUrl}: SocketDescriptor): Promise<ConfigurationContext | null> => {
        const {pathname} = url.parse(connectionUrl, true);
        const contextId = pathname.replace("/", "");
        if (!contextId) {
            return defaultContext;
        }
        return customContext[contextId] ?? null;
    };

    readonly getConfigurationContext = async (id: ContextId): Promise<Readonly<ConfigurationContext> | null> => {
        return customContext[id] ?? null;
    };
}

