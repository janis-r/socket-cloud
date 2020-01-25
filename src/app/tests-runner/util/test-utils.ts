import {launchServer, serverIsRunning, stopServer} from "./server-utils";
import {SocketClient, spawnConnections} from "./connection-utils";
import {PlatformApi} from "./PlatformApi";

const debug = true;

const serverUrl = "http://localhost:8001";
const contextId = "tests-runner";

const clientConnections = new Array<SocketClient>();

const startServerIfNotStarted = done => {
    if (serverIsRunning()) {
        done();
    } else {
        launchServer(debug).then(done);
    }
};
const createConnections = (count: number = 10, cId = contextId) => done => spawnConnections(serverUrl, cId, count)
    .then(connections => {
            clientConnections.push(...connections);
            done()
        }
    );
const resetConnections = done => {
    while (clientConnections.length) {
        clientConnections.shift().close();
    }
    setTimeout(done, 100);
};

const createPlatformApi = (apiKey = 'x-api-key-value') => new PlatformApi(serverUrl, contextId, apiKey);

export const testUtils = {
    serverUrl,
    contextId,
    startServerIfNotStarted,
    stopServer,
    clientConnections: clientConnections as ReadonlyArray<SocketClient>,
    createConnections,
    resetConnections,
    createPlatformApi
};

export const characterSequence = (length: number) => new Array(length).fill(0).map((_, index) => String.fromCharCode('a'.charCodeAt(0) + index));
