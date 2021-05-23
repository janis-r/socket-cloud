import {
    connections,
    createConnections,
    createPlatformApi,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";
import {connectionStatusValidator} from "../../../lib/platformApi/connectionApi/data/ConnectionStatus";

describe('Connection API muticore', () => {

    beforeAll(startSocketServer(false));
    afterAll(stopSocketServer);

    beforeEach(createConnections(10));
    afterEach(resetConnections);

    it('Can retrieve new connection status', async done => {
        const {getConnectionStatus} = await createPlatformApi();
        const {validate} = connectionStatusValidator;

        for (const {authKey} of connections) {
            const status = await getConnectionStatus(authKey);
            expect(validate(status)).toBe(true);
        }
        done();
    });

    it('Connection can be dropped upon request', async done => {
        const {dropConnection} = await createPlatformApi();
        const [connection] = connections;
        connection.onClose(done);
        dropConnection(connection.authKey);
    });
});


