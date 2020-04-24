import {
    characterSequence,
    connections,
    createConnections,
    resetConnections,
    startSocketServer,
    stopSocketServer,
    timeout
} from "../util/test-utils";
import {RestoreChannelsResponseMessage} from "../../../lib/defaultProtocol";
import {defaultCacheSize, defaultCacheTime, notCachedChannelName} from "../config";

describe("Message cache config", () => {

    beforeAll(startSocketServer());
    afterAll(stopSocketServer);

    beforeEach(createConnections(10));
    afterEach(resetConnections);

    it("Channel configured to have no cache will behave as expected", async () => {
        const channel = notCachedChannelName;
        const messages = characterSequence(3).map(v => `${v}`);

        const [firstConnection, secondConnection] = connections;
        messages.forEach(message => firstConnection.sendChannelMessage(message, channel));

        await timeout(500);

        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const {payload: incomingMessages} = await dataPromise;
        expect(incomingMessages.length).toBe(0);
    });

    it("Channel will inherit default caching policy if it ain't got own and shall expect cache size config", async () => {
        const channel = "average-joe";
        const messages = characterSequence(defaultCacheSize * 2).map((v, i) => `${v}-${i}`);
        const [firstConnection, secondConnection] = connections;
        for (const message of messages) {
            firstConnection.sendChannelMessage(message, channel);
            // order of messages while executing test and server from local machine is inconsistent
            await timeout(50);
        }

        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const {payload: incomingMessages} = await dataPromise;
        expect(incomingMessages.length).toBe(defaultCacheSize);
        expect(messages.slice(defaultCacheSize)).toMatchObject(incomingMessages.map(({payload}) => payload));
    });

    it("Cache time directive will take effect over cache size if it hits cache entry fist", async () => {
        const channel = "average-joe I";
        const [firstConnection, secondConnection] = connections;
        const messages = characterSequence(defaultCacheSize).map((v, i) => `${v}-${i}-${Math.floor(Math.random() * 0xFFF)}`);
        const splitIndex = Math.floor(messages.length / 2);
        // Send some messages
        for (const message of messages.slice(0, splitIndex)) {
            firstConnection.sendChannelMessage(message, channel);
        }
        // Time idle for default cache time
        await timeout(defaultCacheTime);
        // Then send some more
        for (const message of messages.slice(splitIndex)) {
            firstConnection.sendChannelMessage(message, channel);
            await timeout(50);
        }
        // And expect that first batch will be out of reach
        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const {payload: incomingMessages} = await dataPromise;
        expect(incomingMessages.length).toBe(defaultCacheSize - splitIndex);
        expect(messages.slice(splitIndex)).toMatchObject(incomingMessages.map(({payload}) => payload));
    });

});
