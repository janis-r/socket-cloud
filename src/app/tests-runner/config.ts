import { toMilliseconds } from "ugd10a";
import { ConfigurationContext } from "../../lib/configurationContext/data/ConfigurationContext";
import { defaultProtocolId } from "../../lib/defaultProtocol/data/defaultProtocolId";


export const debug = true;
export const serverUrl = "http://localhost:8001";
export const cachedChannelName = "cached-channel";
export const notCachedChannelName = "no-cache-channel";
export const defaultCacheSize = 5;
export const defaultCacheTime = toMilliseconds(5, "seconds");

export const configurationContext: ConfigurationContext = {
    id: "tests-runner",
    protocol: defaultProtocolId,
    operatorApi: {
        url: `${serverUrl}/validationAPI`,
        connection: {
            doHandshake: true
        }
    },
    cachingPolicy: {
        cacheSize: defaultCacheSize,
        cacheTime: defaultCacheTime
    },
    channelConfig: {
        [cachedChannelName]: { cachingPolicy: { cacheSize: 100 } },
        [notCachedChannelName]: { cachingPolicy: {} }
    }
};
