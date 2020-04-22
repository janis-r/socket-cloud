import {
    characterSequence,
    connections,
    createConnections,
    defaultCacheSize,
    notCachedChannelName,
    resetConnections,
    startSocketServer,
    stopSocketServer
} from "../util/test-utils";
import {RestoreChannelsResponseMessage} from "../../../lib/defaultProtocol";

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

        await new Promise(resolve => setTimeout(resolve, 500));

        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const {payload: incomingMessages} = await dataPromise;
        expect(incomingMessages.length).toBe(0);
    });

    it("Channel will inherit default caching policy if it ain't got own", async () => {
        const channel = "average-joe";
        const messages = characterSequence(defaultCacheSize * 2).map((v, i) => `${v}-${i}`);
        const [firstConnection, secondConnection] = connections;
        for (const message of messages) {
            firstConnection.sendChannelMessage(message, channel);
            // order of messages while executing test and server from local machine is inconsistent
            await new Promise<void>(resolve => setTimeout(resolve, 100));
        }

        const dataPromise = new Promise<RestoreChannelsResponseMessage>(resolve => secondConnection.onRestore(resolve).once());
        secondConnection.restore({channel});
        const {payload: incomingMessages} = await dataPromise;
        expect(incomingMessages.length).toBe(defaultCacheSize);
        expect(messages.slice(defaultCacheSize)).toMatchObject(incomingMessages.map(({payload}) => payload));
    });

});
