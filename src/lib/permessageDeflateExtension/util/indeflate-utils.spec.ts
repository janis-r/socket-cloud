// describe("Data inflate/deflate utils", async () => {
//
import {getDeflator, getInflator} from "./indeflate-utils";
import {ZlibOptions} from "zlib";

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
    it("Can inflate and then deflate binary data", async (doneCallback) => {
        const options: ZlibOptions = {windowBits: 10};
        const rawData = Buffer.from([
            0x02, 0x02, 0x26, 0x08, 0x66, 0x64, 0xe0, 0x00, 0x32, 0x00, 0x00
        ]);

        const inflated = await getInflator(options)(rawData);
        const deflated = await getDeflator(options)(inflated);
        console.log({rawData, inflated, deflated});
        expect(rawData).toMatchObject(deflated);
        doneCallback();
    });

});
