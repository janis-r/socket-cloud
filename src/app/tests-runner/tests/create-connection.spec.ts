import {createConnections, resetConnections, startSocketServer, stopSocketServer} from "../util/test-utils";

describe('Create connection', () => {

    beforeAll(startSocketServer());
    afterAll(stopSocketServer);

    afterEach(resetConnections);

    it('Will fail connection with nonexistent context id', async done => {
        try {
            await createConnections(1, 'nonexistent-context-id')();
        } catch (e) {
            expect(e).toBeTruthy();
            done();
        }
    });

    it('Will succeed at connecting with valid context id', async done => {
        const data = await createConnections(1)();
        expect(data).toBeTruthy();
        done();
    });
});
