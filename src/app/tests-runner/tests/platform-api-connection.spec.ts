import {
    characterSequence,
    connections,
    createConnections,
    createPlatformApi,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";
import {connectionStatusValidator} from "../../../lib/platformApi/connectionApi/data/ConnectionStatus";
import {toMilliseconds, toSeconds} from "ugd10a";

describe('Connection API', () => {

    beforeAll(startSocketServer());
    afterAll(stopSocketServer);

    beforeEach(createConnections(1));
    afterEach(resetConnections);

    it('Can retrieve new connection status', async () => {
        const {getConnectionStatus} = await createPlatformApi();
        const {validate} = connectionStatusValidator;
        const [{authKey}] = connections;
        const status = await getConnectionStatus(authKey);
        expect(validate(status)).toBe(true);
    });

    it('Connection uptime is reported correctly', async () => {
        const {getConnectionStatus} = await createPlatformApi();
        const {validate} = connectionStatusValidator;
        const [{authKey}] = connections;
        const timeout = toMilliseconds(2, "seconds");
        await new Promise<void>(resolve => setTimeout(resolve, timeout));
        const status = await getConnectionStatus(authKey);
        expect(validate(status)).toBe(true);
        expect(status.uptime).toBeGreaterThanOrEqual(toSeconds(timeout, "milliseconds"));
    });

    it('Connection data upload/download is reported correctly', async () => {
        const {getConnectionStatus} = await createPlatformApi();
        const {validate} = connectionStatusValidator;
        const [connection] = connections;
        const payload = characterSequence(10).join('');
        const times = 10;
        const allMessagesReceived = new Promise<void>(resolve =>
            connection.onMessage(({payload: p}) => {
                if (payload !== p) {
                    throw new Error(`Something is wrong with payload`);
                }
            }).times(times).onComplete(resolve)
        );

        new Array(times).fill(0).forEach(_ => connection.sendGlobalMessage(payload));

        await allMessagesReceived;
        const status = await getConnectionStatus(connection.authKey);

        const minBytes = Buffer.byteLength(payload) * times;
        expect(validate(status)).toBe(true);
        expect(status.bytesSent).toBeGreaterThan(minBytes);
        expect(status.bytesReceived).toBeGreaterThan(minBytes);
    });

    it('Connection can be droped upon request', async done => {
        const {dropConnection} = await createPlatformApi();
        const [connection] = connections;
        connection.onClose(() => {
            done();
        })
        dropConnection(connection.authKey);
    });
});


