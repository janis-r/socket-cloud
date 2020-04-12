import {launchServer, serverIsRunning, stopServer} from "./server-utils";
import {SocketClient, spawnConnections} from "./connection-utils";
import {PlatformApi} from "./PlatformApi";
import {accessTokenApiKey, configurationContextApiKey} from "../../dev-server/devServerModule";
import {AccessTokenApi} from "./AccessTokenApi";
import {ConfigurationContextApi} from "./ConfigurationContextApi";

const debug = true;

const serverUrl = "http://localhost:8001";
const contextId = "tests-runner";

const _clientConnections = new Array<SocketClient>();
export const connections: ReadonlyArray<SocketClient> = _clientConnections;

export const startSocketServer = (singleCore = true) => done => {
    if (serverIsRunning()) {
        done();
    } else {
        launchServer(singleCore, debug).then(done);
    }
};
export const stopSocketServer = done => {
    if (stopServer()) {
        setTimeout(done, 100)
    } else {
        done();
    }
};

export const createConnections = (count: number = 10, cId = contextId) => async (done?: () => void) => {
    const connections = await spawnConnections(serverUrl, cId, count);
    _clientConnections.push(...connections);
    done && done();
    return connections;
};

export const resetConnections = done => {
    if (!_clientConnections.length) {
        done();
        return;
    }

    while (_clientConnections.length) {
        _clientConnections.shift().close();
    }
    setTimeout(done, 100);
};

export const jsonHeaders = {"Accept": "application/json", "Content-Type": "application/json"};
export const createHeaders = (apiKey: string, useJson = true) => {
    const headers = useJson ? jsonHeaders : {};
    if (apiKey) {
        return {...headers, "X-API-KEY": apiKey};
    }
    return {...headers};
};

export const createPlatformApi = (apiKey = 'valid-x-api-key') => new PlatformApi(serverUrl, contextId, apiKey);

export const createAccessTokenApi = (apiKey = accessTokenApiKey) => new AccessTokenApi(serverUrl, contextId, apiKey);
export const createConfigurationContextApi = (apiKey = configurationContextApiKey) => new ConfigurationContextApi(serverUrl, apiKey);

export const characterSequence = (length: number) => new Array(length).fill(0).map((_, index) => String.fromCharCode('a'.charCodeAt(0) + index));
