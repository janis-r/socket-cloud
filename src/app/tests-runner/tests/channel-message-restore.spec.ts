import {characterSequence, testUtils} from "../util/test-utils";
import {restoreResponseUtil} from "../../../lib/deliveryProtocol/data/serverMessage/RestoreChannelsResponseMessage";
import {
    PushToClientMessage,
    pushToClientUtil
} from "../../../lib/deliveryProtocol/data/serverMessage/PushToClientMessage";

const {startServerIfNotStarted, stopServer, clientConnections, createConnections, resetConnections} = testUtils;

describe('Channel message restoring', () => {

    beforeAll(startServerIfNotStarted);
    afterAll(stopServer);

    beforeEach(createConnections());
    afterEach(resetConnections);

    it('Channel subscription can be restored', async (done) => {
        const channel = 'cached-channel';
        const messages = characterSequence(10);
        await new Promise<void>(resolve => createConnections(2)(resolve));
        const [firstConnection, secondConnection] = clientConnections;
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

        await new Promise<void>(resolve => createConnections(2)(resolve));
        const [firstConnection, secondConnection] = clientConnections;

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

            expect(incomingMessages.slice(restoreIndex + 1).map(({payload}) => payload)).toMatchObject(message.payload.map(({payload}) => payload));
            done();
        });

        secondConnection.restore({channel, messageId: incomingMessages[restoreIndex].messageId});
    });

});
