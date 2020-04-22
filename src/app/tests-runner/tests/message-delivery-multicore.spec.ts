import {MessageType} from "../../../lib/defaultProtocol/data";
import {
    connections,
    createConnections,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";

describe("Message delivery multicore", () => {

    beforeAll(startSocketServer(false));
    afterAll(stopSocketServer);

    beforeEach(createConnections(100));
    afterEach(resetConnections);

    it(`Can send global messages`, async done => {
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        let counter = connections.length;
        connections.forEach(({onMessage}) =>
            onMessage(message => {
                if (message.payload !== payload) {
                    fail(`payload !== payload`);
                    return;
                }
                counter--;
                if (counter === 0) {
                    done();
                }
            })
        );
        connections[0].sendGlobalMessage(payload);
    }, 10000);

    it(`Can send messages to channel`, async done => {
        const channel = "foo";
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        const sendToClients = Math.floor(connections.length / 2);
        let counter = sendToClients;

        connections.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                if (message.payload !== payload || message.type !== MessageType.PushToClient || !message.channels.includes(channel)) {
                    fail(`Wrong message data`);
                    return;
                }
                counter--;
                if (counter === 0) {
                    done();
                }
            })
        );
        connections.slice(0, sendToClients).forEach(client => client.subscribe(channel));

        await new Promise<void>(resolve => setTimeout(resolve, 100));
        connections[0].sendChannelMessage(payload, channel);
    });

    it(`Can send messages to multiple channels`, async done => {
        const channels = ["foo", "bar"];
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        const sendToClients = Math.floor(connections.length / 2);
        let counter = sendToClients;

        connections.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                if (message.payload !== payload || message.type !== MessageType.PushToClient || message.channels.toString() !== channels.toString()) {
                    fail(`Wrong message data`);
                    return;
                }
                counter--;
                if (counter === 0) {
                    done();
                }
            })
        );
        connections.slice(0, sendToClients).forEach(client => client.subscribe(...channels));

        await new Promise<void>(resolve => setTimeout(resolve, 100));
        connections[0].sendChannelMessage(payload, ...channels);
    });

});
