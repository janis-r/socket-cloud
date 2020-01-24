import {spawnConnections} from "../util/connection-utils";
import {testUtils} from "../util/test-utils";

describe('Create connection', () => {

    const {startServerIfNotStarted, contextId, serverUrl, stopServer} = testUtils;

    beforeAll(startServerIfNotStarted);
    afterAll(stopServer);

    it('Will fail connection with nonexistent context id', done => {
        spawnConnections(serverUrl, 'nonexistent-context-id', 1).catch(err => {
            expect(err).toBeTruthy();
            done();
        });
    });

    it('Will succeed at connecting with valid context id', done => {
        spawnConnections(serverUrl, contextId, 1)
            .then(data => {
                expect(data).toBeTruthy();
                done();
            });
    });
});
