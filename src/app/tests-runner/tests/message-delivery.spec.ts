import {MessageType} from "../../../lib/deliveryProtocol/data";
import {testUtils} from "../util/test-utils";

const {startServerIfNotStarted, stopServer, clientConnections, createConnections, resetConnections} = testUtils;

describe('Message delivery', () => {

    beforeAll(startServerIfNotStarted);
    afterAll(stopServer);

    beforeEach(createConnections());
    afterEach(resetConnections);

    it(`Can send global messages`, async done => {
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        let counter = clientConnections.length;
        clientConnections.forEach(({onMessage}) =>
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
        clientConnections[0].sendGlobalMessage(payload);
    });

    it(`Can send messages to channel`, async done => {
        const channel = "foo";
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        const sendToClients = Math.floor(clientConnections.length / 2);
        let counter = sendToClients;

        clientConnections.forEach(({onMessage, connectionId}) =>
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
        clientConnections.slice(0, sendToClients).forEach(client => client.subscribe(channel));

        await new Promise<void>(resolve => setTimeout(resolve, 100));
        clientConnections[0].sendChannelMessage(payload, channel);
    });

    it(`Can send messages to multiple channels`, async done => {
        const channels = ["foo", "bar"];
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        const sendToClients = Math.floor(clientConnections.length / 2);
        let counter = sendToClients;

        clientConnections.forEach(({onMessage, connectionId}) =>
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
        clientConnections.slice(0, sendToClients).forEach(client => client.subscribe(...channels));

        await new Promise<void>(resolve => setTimeout(resolve, 100));
        clientConnections[0].sendChannelMessage(payload, ...channels);
    });

});
