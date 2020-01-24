import {MessageType} from "../../../lib/deliveryProtocol/data";
import {testUtils} from "../util/test-utils";

const {startServerIfNotStarted, stopServer, clientConnections, createConnections, resetConnections, createPlatformApi} = testUtils;

describe('Platform API', () => {

    beforeAll(startServerIfNotStarted);
    afterAll(stopServer);

    beforeEach(createConnections());
    afterEach(resetConnections);

    it('Can post single individual message to several clients', async done => {

        const platformApi = createPlatformApi();

        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);

        let messageCount = 0;
        let recipientCount = 0;

        clientConnections.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                if (message.type !== MessageType.PushToClient) {
                    throw new Error(`Wrong message data`);
                }
                if (message.payload !== payload) {
                    throw new Error(`Wrong payload`);
                }
                if (message.channels && message.channels.length > 0) {
                    throw new Error(`Message channels must be empty or not set`);
                }
                messageCount++;
                if (messageCount === clientConnections.length && recipientCount) {
                    done();
                }
            })
        );

        const {recipients} = await platformApi.individualMessage(
            payload,
            ...clientConnections.map(({connectionId}) => connectionId.toString())
        );
        expect(recipients).toBe(clientConnections.length);
        if (messageCount === clientConnections.length) {
            done();
        }

        recipientCount = recipients;
    });

    it('Can post unique individual message to several clients', async done => {
        const platformApi = createPlatformApi();
        const messageCount = clientConnections.length;
        let receivedMessagesCount = 0;
        let sendToCount = 0;

        clientConnections.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                if (message.type !== MessageType.PushToClient) {
                    throw new Error(`Wrong message data`);
                }
                if (message.payload !== connectionId.toString()) {
                    throw new Error(`Wrong payload`);
                }
                if (message.channels && message.channels.length > 0) {
                    throw new Error(`Message channels must be empty or not set`);
                }
                receivedMessagesCount++;
                if (receivedMessagesCount === messageCount && sendToCount === messageCount) {
                    done();
                }
            })
        );
        clientConnections
            .map(({connectionId}) => connectionId.toString())
            .forEach(async id => {
                const {recipients} = await platformApi.individualMessage(id, id);
                expect(recipients).toBe(1);
                sendToCount += recipients;
                if (sendToCount === messageCount && receivedMessagesCount === messageCount) {
                    done();
                }
            });
    });

});
