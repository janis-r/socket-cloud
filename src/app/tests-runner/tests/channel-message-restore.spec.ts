import {
    characterSequence,
    connections,
    createConnections,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";
import {PushToClientMessage, pushToClientUtil, restoreResponseUtil} from "../../../lib/deliveryProtocol";

describe('Channel message restoring', () => {

    beforeAll(startSocketServer);
    afterAll(stopSocketServer);

    beforeEach(createConnections(2));
    afterEach(resetConnections);

    it('Channel subscription can be restored', async (done) => {
        const channel = 'cached-channel';
        const messages = characterSequence(10);
        const [firstConnection, secondConnection] = connections;

        messages.forEach(message => firstConnection.sendChannelMessage(message, channel));

        secondConnection.onRestore(message => {
            if (!restoreResponseUtil.validate(message)) {
                fail('Incoming message must be valid RestoreResponse');
                return;
            }

            for (const {channels} of message.payload) {
                if (!channels.includes(channel)) {
                    fail(`Restored message must include channel it was requested by`);
                    return;
                }
            }

            expect(messages).toMatchObject(message.payload.map(({payload}) => payload));
            done();
        });

        secondConnection.restore({channel});
    });

    it('Channel subscription can be restored from last received message', async (done) => {
        const channel = 'cached-channel';
        const messages = characterSequence(10);
        const [firstConnection, secondConnection] = connections;

        const incomingMessages = new Array<PushToClientMessage>();
        firstConnection.subscribe(channel);
        firstConnection.onMessage(message => {
            if (!pushToClientUtil.validate(message)) {
                fail('Incoming message must be valid PushToClientMessage');
                return;
            }
            incomingMessages.push(message);
        });

        messages.forEach(message => firstConnection.sendChannelMessage(message, channel));
        await new Promise<void>(resolve => setTimeout(resolve, 100));

        const restoreIndex = Math.floor(incomingMessages.length / 2);
        secondConnection.onRestore(message => {
            if (!restoreResponseUtil.validate(message)) {
                fail('Incoming message must be valid RestoreResponse');
                return;
            }

            for (const {channels} of message.payload) {
                if (!channels.includes(channel)) {
                    fail(`Restored message must include channel it was requested by`);
                    return;
                }
            }

            expect(
                incomingMessages.slice(restoreIndex + 1).map(({messageId, payload}) => ({messageId, payload}))
            ).toMatchObject(
                message.payload.map(({messageId, payload}) => ({messageId, payload}))
            );
            done();
        });

        secondConnection.restore({channel, messageId: incomingMessages[restoreIndex].messageId});
    });

});
