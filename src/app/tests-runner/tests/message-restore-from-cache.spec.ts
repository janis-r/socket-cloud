import {
    characterSequence,
    connections,
    createConnections,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";
import {PushToClientMessage} from "../../../lib/defaultProtocol/data/serverMessage/PushToClientMessage";
import {RestoreChannelsResponseMessage} from "../../../lib/defaultProtocol/data/serverMessage/RestoreChannelsResponseMessage";
import {cachedChannelName} from "../config";

describe("Message restore from cache", () => {

    beforeAll(startSocketServer());
    afterAll(stopSocketServer);

    beforeEach(createConnections(2));
    afterEach(resetConnections);

    it("Channel messages can be restored from cache", async done => {
        const channel = cachedChannelName;
        const messages = characterSequence(10).map(v => `${v}-${Math.floor(Math.random() * 0xFFF)}`);
        const [firstConnection, secondConnection] = connections;
        messages.forEach(message => firstConnection.sendChannelMessage(message, channel));

        await new Promise(resolve => setTimeout(resolve, 1000));

        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const {payload: incomingMessages} = await dataPromise;
        if (incomingMessages.some(({channels}) => !channels.includes(channel) && channels.length !== 1)) {
            fail(`Restored message must include only channel it was requested by`);
        }

        expect(messages.some(msg => !incomingMessages.some(({payload}) => payload === msg))).toBe(false);
        done();
    });

    it("Channel messages can be restored by last message id", async done => {
        const channel = cachedChannelName;
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
                .guard(message => {
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
