import {launchServer, stopServer} from "../util/server-utils";
import {SocketClient, spawnConnections} from "../util/connection-utils";
import {MessageType} from "../../../lib/deliveryProtocol/data";

describe('Tests runner!', () => {

    const url = "http://localhost:8001";

    // beforeAll(cb => launchServer().then(cb));
    // afterAll(stopServer);

    let clients: SocketClient[];
    beforeEach(async done => {
        clients = await spawnConnections(10, url);
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
    it(`Can send messages to channel`, done => {
        const channel = "foo";
        const payload = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
        const sendToClients = 5;
        let counter = sendToClients;

        clients.forEach(({onMessage, connectionId}) =>
            onMessage(message => {
                console.log({connectionId, message})
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
        clients[0].sendChannelMessage(payload, channel);
    });
    it(`Can send messages to multiple channels`, () => {
    });

});
