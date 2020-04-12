import {createConfigurationContextApi, startSocketServer, stopSocketServer} from "../util/test-utils";

describe('Configuration context API', () => {

    beforeAll(startSocketServer());
    afterAll(stopSocketServer);

    it('Wrong api key will lead to error', async done => {
        const {configureConfigurationContext} = createConfigurationContextApi('invalid-api-key');
        try {
            await configureConfigurationContext({id: "will never be in use"});
        } catch (e) {
            console.log(e.message);
            expect(e).toBeTruthy();
            done();
        }
    });

    it('Can create, retrieve and then delete configuration', async done => {
        const {configureConfigurationContext, getConfigurationContext, deleteConfigurationContext} = createConfigurationContextApi();
        const contextId = "test-cntx-" + Math.floor(Math.random() * 0xFFFFFF).toString(32);
        const configuration = {id: contextId, protocol: "A fancy one"};
        await configureConfigurationContext(configuration);
        expect(configuration).toMatchObject(await getConfigurationContext(contextId));
        await deleteConfigurationContext(contextId);
        try {
            await getConfigurationContext(contextId);
        } catch (e) {
            done();
        }
    });

});
