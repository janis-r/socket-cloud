import * as zlib from "zlib";
import { DeflateRaw, InflateRaw, ZlibOptions } from "zlib";

const trailerBytes = Buffer.from([0x00, 0x00, 0xff, 0xff]);

export const getInflator = (options: ZlibOptions) => async (payload: Buffer) => {
    const data = await processData(zlib.createInflateRaw(options), payload, true);
    return removeEndBytes(data);
};

export const getDeflator = (options: ZlibOptions) => async (payload: Buffer) => {
    const data = await processData(zlib.createDeflateRaw(options), payload);
    return removeEndBytes(data);
    // return data;
};

const removeEndBytes = (data: Buffer) => {
    if (data.slice(data.length - trailerBytes.length).compare(trailerBytes) !== 0) {
        return data;
    }
    return data.slice(0, data.length - trailerBytes.length);
};

const processData = (processor: InflateRaw | DeflateRaw, data: Buffer, writeTrailer?: boolean) => new Promise<Buffer>((resolve, reject) => {
    const chunks = new Array<Buffer>();
    let length = 0;

    const errorHandler = err => {
        reject(err);
    };
    const dataHandler = chunk => {
        chunks.push(chunk);
        length += chunk.length;
    };

    processor.on("error", errorHandler);
    processor.on("data", dataHandler);

    processor.write(data);
    if (writeTrailer) {
        processor.write(trailerBytes);
    }
    processor.flush(() => {
        processor.removeListener("error", errorHandler);
        processor.removeListener("data", dataHandler);
        processor.close();
        resolve(Buffer.concat(chunks, length));
    });
});
