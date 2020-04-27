import {toMilliseconds} from "ugd10a";
import {ConfigurationContext} from "../../lib/configurationContext";
import {defaultProtocolId} from "../../lib/defaultProtocol";

export const debug = true;
export const serverUrl = "http://localhost:8001";
export const cachedChannelName = "cached-channel";
export const notCachedChannelName = "no-cache-channel";
export const defaultCacheSize = 5;
export const defaultCacheTime = toMilliseconds(5, "seconds");

export const configurationContext: ConfigurationContext = {
    id: "tests-runner",
    protocol: defaultProtocolId,
    validationApi: {
        url: `${serverUrl}/validationAPI`,
        validateNewConnections: true
    },
    cachingPolicy: {
        cacheSize: defaultCacheSize,
        cacheTime: defaultCacheTime
    },
    channelConfig: {
        [cachedChannelName]: {cachingPolicy: {cacheSize: 100}},
        [notCachedChannelName]: {cachingPolicy: {}}
    }
};
