import {SocketClient, spawnConnections} from "../util/connection-utils";
import {MessageType} from "../../../lib/deliveryProtocol/data";
import {launchServer, stopServer} from "../util/server-utils";

describe('Tests runner!', () => {

    const serverUrl = "http://localhost:8001";
    const contextId = "tests-runner";

    describe('General tests', () => {
        beforeAll(done => launchServer().then(done));
        afterAll(stopServer);

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

    describe('Can send messages', () => {

        const connectionCount = 10;

        beforeAll(cb => launchServer().then(cb));
        afterAll(stopServer);

        let clients: SocketClient[];
        beforeEach(async done => {
            clients = await spawnConnections(serverUrl, contextId, connectionCount);
            done();
        });
        afterEach(() => {
            if (clients) {
                while (clients.length) {
                    clients.shift().close();
                }
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
    })
});
