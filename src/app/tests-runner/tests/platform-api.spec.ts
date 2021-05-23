import {connections, createPlatformApi} from "../util/test-utils";

describe('Platform API in general', () => {
    it('Post with unauthorized access token will produce error', async done => {
        const platformApi = await createPlatformApi('invalid-access-token');
        try {
            await platformApi.individualMessage("payload", connections[0].connectionId.toString());
        } catch (e) {
            expect(e).toBeTruthy();
            done();
        }
    });
});
