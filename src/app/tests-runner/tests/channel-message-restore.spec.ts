import {
    characterSequence,
    connections,
    createConnections,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";
import {PushToClientMessage, RestoreChannelsResponseMessage} from "../../../lib/deliveryProtocol";

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

        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const message = await dataPromise;
        if (message.payload.some(({channels}) => !channels.includes(channel))) {
            fail(`Restored message must include channel it was requested by`);
        }
        expect(messages).toMatchObject(message.payload.map(({payload}) => payload));
        done();
    });

    it('Channel subscription can be restored from last received message', async (done) => {
        const channel = 'cached-channel';
        const messages = characterSequence(10);
        const [firstConnection, secondConnection] = connections;

        const incomingMessages = new Array<PushToClientMessage>();
        firstConnection.subscribe(channel);
        const ready = new Promise<void>(resolve =>
            firstConnection.onMessage(message => incomingMessages.push(message))
                .times(messages.length)
                .onComplete(resolve)
        );
        messages.forEach(message => firstConnection.sendChannelMessage(message, channel));
        await ready;

        const restoreIndex = Math.floor(incomingMessages.length / 2);
        const restorePromise = new Promise<RestoreChannelsResponseMessage>(resolve => {
            secondConnection.onRestore(resolve)
                .filter(message => {
                    if (message.payload.some(({channels}) => !channels.includes(channel))) {
                        fail(`Restored message must include channel it was requested by`);
                    }
                    return true;
                }).once();
        });

        const {messageId} = incomingMessages[restoreIndex];
        secondConnection.restore({channel, filter: {messageId}});

        const restoredMessages = await restorePromise;
        expect(
            incomingMessages.slice(restoreIndex + 1).map(({messageId, payload}) => ({messageId, payload}))
        ).toMatchObject(
            restoredMessages.payload.map(({messageId, payload}) => ({messageId, payload}))
        );
        done();
    });

});
