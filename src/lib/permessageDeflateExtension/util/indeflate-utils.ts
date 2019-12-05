import * as zlib from "zlib";
import {DeflateRaw, InflateRaw, ZlibOptions} from "zlib";

export const getInflator = (options: ZlibOptions) => (payload: Buffer) => processData(zlib.createInflateRaw(options), payload);

export const getDeflator = (options: ZlibOptions) => async (payload: Buffer) => {
    const data = await processData(zlib.createDeflateRaw(options), payload);
    return data.slice(0, data.length - 4);
};

const processData = (processor: InflateRaw | DeflateRaw, data: Buffer) => new Promise<Buffer>((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let length = 0;

    const errorHandler = err => reject(err);
    const dataHandler = chunk => {
        chunks.push(chunk);
        length += chunk.length;
    };

    processor.on("error", errorHandler);
    processor.on("data", dataHandler);

    processor.write(data);
    processor.flush(() => {
        processor.removeListener("error", errorHandler);
        processor.removeListener("data", dataHandler);

        let payload = Buffer.concat(chunks, length);
        payload = payload.slice(0, payload.length - 4);

        resolve(Buffer.concat(chunks, length));
    });
});
