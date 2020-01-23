import {SocketClient, spawnConnections} from "../util/connection-utils";
import {MessageType} from "../../../lib/deliveryProtocol/data";
import {settings} from "../settings";
import {PlatformApi} from "../util/PlatformApi";
import {launchServer, stopServer} from "../util/server-utils";

describe('Tests runner!', () => {

    const {serverUrl, contextId} = settings;

    beforeAll(cb => launchServer().then(cb));
    afterAll(stopServer);

    describe('General tests', () => {
        it('Will fail connection with nonexistent context id', done => {
            spawnConnections(serverUrl, 'nonexistent-context-id', 1).catch(err => {
                expect(err).toBeTruthy();
                done();
            });
        });

        it('Will succeed at connecting with valid context id', done => {
            spawnConnections(serverUrl, 'tests-runner', 1)
                .then(data => {
                    expect(data).toBeTruthy();
                    done();
                });
        });
    });
    describe('Message delivery', () => {
        const connectionCount = 10;

        let clients = new Array<SocketClient>();
        beforeEach(async done => {
            clients = await spawnConnections(serverUrl, contextId, connectionCount);
            done();
        });
        afterEach(() => {
            while (clients.length) {
                clients.shift().close();
            }
        });

        it(`Can send global messages`, async (done) => {
            const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
            let counter = clients.length;
            clients.forEach(({onMessage}) =>
                onMessage(message => {
                    if (message.payload !== payload) {
                        throw new Error(`payload !== payload`);
                    }
                    counter--;
                    if (counter === 0) {
                        done();
                    }
                })
            );
            clients[0].sendGlobalMessage(payload);
        });
        it(`Can send messages to channel`, async done => {
            const channel = "foo";
            const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
            const sendToClients = Math.floor(clients.length / 2);
            let counter = sendToClients;

            clients.forEach(({onMessage, connectionId}) =>
                onMessage(message => {
                    if (message.payload !== payload || message.type !== MessageType.PushToClient || !message.channels.includes(channel)) {
                        throw new Error(`Wrong message data`);
                    }
                    counter--;
                    if (counter === 0) {
                        done();
                    }
                })
            );
            clients.slice(0, sendToClients).forEach(client => client.subscribe(channel));

            await new Promise<void>(resolve => setTimeout(resolve, 100));
            clients[0].sendChannelMessage(payload, channel);
        });
        it(`Can send messages to multiple channels`, async done => {
            const channels = ["foo", "bar"];
            const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
            const sendToClients = Math.floor(clients.length / 2);
            let counter = sendToClients;

            clients.forEach(({onMessage, connectionId}) =>
                onMessage(message => {
                    if (message.payload !== payload || message.type !== MessageType.PushToClient || message.channels.toString() !== channels.toString()) {
                        throw new Error(`Wrong message data`);
                    }
                    counter--;
                    if (counter === 0) {
                        done();
                    }
                })
            );
            clients.slice(0, sendToClients).forEach(client => client.subscribe(...channels));
            // TODO: Is here any problem?
            await new Promise<void>(resolve => setTimeout(resolve, 100));
            clients[0].sendChannelMessage(payload, ...channels);

        });
    });
    describe('Platform API', () => {
        const connectionCount = 10;

        const platformApi = new PlatformApi(serverUrl, contextId, 'x-api-key-value');
        let clients = new Array<SocketClient>();
        beforeEach(async done => {
            clients = await spawnConnections(serverUrl, contextId, connectionCount);
            done();
        });
        afterEach(() => {
            while (clients.length) {
                clients.shift().close();
            }
        });

        it('Can post single individual message to several clients', async done => {
            const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);

            let messageCount = 0;
            let recipientCount = 0;

            clients.forEach(({onMessage, connectionId}) =>
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
                    if (messageCount === clients.length && recipientCount) {
                        done();
                    }
                })
            );

            const {recipients} = await platformApi.individualMessage(
                payload,
                ...clients.map(({connectionId}) => connectionId.toString())
            );
            expect(recipients).toBe(clients.length);
            if (messageCount === clients.length) {
                done();
            }

            recipientCount = recipients;
        });

        it('Can post unique individual message to several clients', async done => {
            const messageCount = clients.length;
            let receivedMessagesCount = 0;
            let sendToCount = 0;

            clients.forEach(({onMessage, connectionId}) =>
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
            clients
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
});
