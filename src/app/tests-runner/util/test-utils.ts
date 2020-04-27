import {launchServer, serverIsRunning, stopServer} from "./server-utils";
import {SocketClient, spawnConnections} from "./connection-utils";
import {PlatformApi} from "./PlatformApi";
import {accessTokenApiKey, configurationContextApiKey} from "../../dev-server/devServerModule";
import {AccessTokenApi} from "./AccessTokenApi";
import {ConfigurationContextApi} from "./ConfigurationContextApi";
import {AccessTokenApiListener} from "../../../lib/authorization/service/AccessTokenApiListener";
import {ConfigurationContextApiListener} from "../../../lib/configurationContext/service/ConfigurationContextApiListener";
import {configurationContext, debug, serverUrl} from "../config";
import {DataPushApiListener} from "../../../lib/defaultProtocol/service/DataPushApiListener";

const contextId = configurationContext.id;

const _clientConnections = new Array<SocketClient>();
export const connections: ReadonlyArray<SocketClient> = _clientConnections;

export const startSocketServer = (singleCore = true) => done => {
    if (serverIsRunning()) {
        done();
    } else {
        launchServer(singleCore, debug)
            .then(() => createConfigurationContextApi().configureConfigurationContext(configurationContext))
            .then(done);
    }
};
export const stopSocketServer = done => {
    if (stopServer()) {
        setTimeout(done, 100);
        // createConfigurationContextApi().deleteConfigurationContext(testContext.id);
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

export const createPlatformApi = async (apiKey?: string) => {
    if (!apiKey) {
        apiKey = await createAccessTokenApi().createAccessEntry({
            accessRights: "all"
        });
    }
    const servicePath = `${serverUrl}/${DataPushApiListener.servicePath}`;
    return new PlatformApi(servicePath, contextId, apiKey);
};

export const createAccessTokenApi = (apiKey = accessTokenApiKey) => {
    const servicePath = `${serverUrl}/${AccessTokenApiListener.servicePath}`;
    return new AccessTokenApi(servicePath, contextId, apiKey);
};

export const createConfigurationContextApi = (apiKey = configurationContextApiKey) => {
    const servicePath = `${serverUrl}/${ConfigurationContextApiListener.servicePath}`;
    return new ConfigurationContextApi(servicePath, apiKey);
};

export const characterSequence = (length: number) => new Array(length).fill(0).map((_, index) => String.fromCharCode('a'.charCodeAt(0) + index));

export const timeout = (time: number) => new Promise<void>(resolve => setTimeout(resolve, time));
