// describe("Data inflate/deflate utils", async () => {
//
import {getDeflator, getInflator} from "./indeflate-utils";

describe('Data inflate/deflate', () => {

    it("Can deflate and then inflate simple string", async (doneCallback) => {
        const options = {};
        const rawData = Buffer.from("qwerty");
        const deflate = getDeflator(options);
        const deflated = await deflate(rawData);
        const inflate = getInflator(options);
        const inflated = await inflate(deflated);
        expect(rawData).toMatchObject(inflated);
        doneCallback();
    });
    it("Can deflate and then inflate few integers", async (doneCallback) => {
        const options = {};
        const rawData = Buffer.from([1, 2, 3]);
        const deflated = await getDeflator(options)(rawData);
        const inflated = await getInflator(options)(deflated);
        expect(rawData).toMatchObject(inflated);
        doneCallback();
    });
    it("Can deflate and then inflate fragmented message", async (doneCallback) => {
        const options = {};
        const rawData = Buffer.from([1, 2, 3, 4, 5, 6]);

        const deflate = getDeflator(options);
        const inflate = getInflator(options);

        const deflated = new Array<Buffer>();
        for (const chunk of [rawData.slice(0, 2), rawData.slice(2)]) {
            deflated.push(await deflate(chunk));
        }

        const inflated = new Array<Buffer>();
        for (const chunk of deflated) {
            inflated.push(await inflate(chunk));
        }

        expect(rawData).toMatchObject(Buffer.concat(inflated));
        doneCallback();
    });
});
