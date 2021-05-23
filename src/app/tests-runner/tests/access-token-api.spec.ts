import { createAccessTokenApi, startSocketServer, stopSocketServer } from "../util/test-utils";

describe('Access token API', () => {

    beforeAll(startSocketServer());
    afterAll(stopSocketServer);

    it('Wrong api key will lead to error', async done => {
        const { createAccessEntry } = createAccessTokenApi('invalid-api-key');
        try {
            await createAccessEntry();
        } catch (e) {
            expect(e).toBeTruthy();
            done();
        }
    });

    it('Can create new access entry and then delete it', async () => {
        const { createAccessEntry, deleteAccessToken } = createAccessTokenApi();
        const token = await createAccessEntry();
        expect(token).toBeTruthy();
        await deleteAccessToken(token);
    });

    it('Can retrieve all context tokens', async () => {
        const { createAccessEntry, getTokensByContext } = createAccessTokenApi();
        const newEntryToken = await createAccessEntry();
        const data = await getTokensByContext();
        expect(Array.isArray(data)).toBe(true);
        expect(data.find(({ token }) => token === newEntryToken)).toBeTruthy();
    });

    it('Requesting non existent context tokens will return empty array', async () => {
        const { getTokensByContext } = createAccessTokenApi();
        const data = await getTokensByContext('foo-bar-' + Math.floor(Math.random() * 0xFFFFFF).toString(16));
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
    });

    it('Can retrieve context token entry', async () => {
        const { createAccessEntry, getTokenData } = createAccessTokenApi();
        const newEntryToken = await createAccessEntry();
        const data = await getTokenData(newEntryToken);
        expect(data.token).toBe(newEntryToken);
    });

    it('Storing invalid access configuration will cause error', async done => {
        const { createAccessEntry } = createAccessTokenApi();
        try {
            await createAccessEntry({ thisIsNotAllowedKey: true } as any);
        } catch (e) {
            expect(e).toBeTruthy();
            done();
        }
    });
});
