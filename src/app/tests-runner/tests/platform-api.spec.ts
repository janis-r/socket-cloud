import {MessageType} from "../../../lib/deliveryProtocol/data";
import {
    connections,
    createConnections,
    createPlatformApi,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";

describe('Platform API', () => {

    beforeAll(startSocketServer);
    afterAll(stopSocketServer);

    beforeEach(createConnections(1));
    afterEach(resetConnections);

    it('Post with unauthorized access token will produce error', async done => {
        const platformApi = createPlatformApi('invlid-access-token');
        try {
            await platformApi.individualMessage("payload", connections[0].connectionId.toString());
        } catch (e) {
            expect(e).toBeTruthy();
            done();
        }
    });
    it('Can post single individual message to several clients', async done => {

        const platformApi = createPlatformApi();
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);

        let messageCount = 0;
        let recipientCount = 0;

        connections.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                if (message.type !== MessageType.PushToClient) {
                    fail(`Wrong message data`);
                } else if (message.payload !== payload) {
                    fail(`Wrong payload`);
                } else if (message.channels && message.channels.length > 0) {
                    fail(`Message channels must be empty or not set`);
                } else {
                    messageCount++;
                    if (messageCount === connections.length && recipientCount) {
                        done();
                    }
                }
            })
        );

        const {recipients} = await platformApi.individualMessage(
            payload,
            ...connections.map(({connectionId}) => connectionId.toString())
        );
        expect(recipients).toBe(connections.length);
        if (messageCount === connections.length) {
            done();
        }

        recipientCount = recipients;
    });

    it('Can post unique individual message to several clients', async done => {
        const platformApi = createPlatformApi();
        const messageCount = connections.length;
        let receivedMessagesCount = 0;
        let sendToCount = 0;

        connections.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                if (message.type !== MessageType.PushToClient) {
                    fail(`Wrong message data`);
                } else if (message.payload !== connectionId.toString()) {
                    fail(`Wrong payload`);
                } else if (message.channels && message.channels.length > 0) {
                    fail(`Message channels must be empty or not set`);
                } else {
                    receivedMessagesCount++;
                    if (receivedMessagesCount === messageCount && sendToCount === messageCount) {
                        done();
                    }
                }
            })
        );
        connections
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

    it('Can post channel message', async done => {
        const platformApi = createPlatformApi();
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        const channel = "channel-name";

        const ready = new Promise<void>(resolve => {
            let received = 0;
            connections.forEach(connection => {
                connection.subscribe(channel);
                connection.onMessage(() => received++)
                    .filter(({channels, payload: p}) => channels.includes(channel) && p === payload)
                    .once()
                    .onComplete(() => {
                        if (received === connections.length) {
                            resolve();
                        }
                    });
            })
        });

        const {recipients} = await platformApi.channelMessage(payload, channel);
        await ready;
        expect(recipients).toBe(connections.length);
        done();
    });

    it('Can post several channel messages', async done => {
        const platformApi = createPlatformApi();
        const payloads = [
            Math.floor(Math.random() * 0xFFFFFFFF).toString(16),
            Math.floor(Math.random() * 0xFFFFFFFF).toString(16)
        ];
        const channels = ["A", "B"];
        const ready = new Promise<void>(resolve => {
            let received = 0;
            connections.forEach(connection => {
                connection.subscribe(...channels);
                connection.onMessage(message => received++)
                    .filter(({channels: [c], payload: p}) =>
                        channels.includes(c) && channels.indexOf(c) === payloads.indexOf(p)
                    )
                    .twice()
                    .onComplete(() => {
                        if (received === connections.length * 2) {
                            resolve();
                        }
                    });
            })
        });

        const {recipients} = await platformApi.multiChannelMessage(...payloads.map((payload, index) => ({
            payload,
            channels: [channels[index]]
        })));
        await ready;
        expect(recipients).toBe(connections.length * 2);
        done();
    });

});
