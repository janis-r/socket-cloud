import * as zlib from "zlib";
import {DeflateRaw, InflateRaw, ZlibOptions} from "zlib";

const endBytes = Buffer.from([0x00, 0x00, 0xff, 0xff]);

const options: ZlibOptions = {};
const processor: DeflateRaw = zlib.createDeflateRaw(options);
const data = Buffer.from("qwerty");

console.log('>> data', data);
const chunks = new Array<Buffer>();
let length = 0;

const errorHandler = err => {
    console.log('>> errorHandler', err);
};
const dataHandler = chunk => {
    console.log('>> dataHandler', chunk);
    chunks.push(chunk);
    length += chunk.length;
};

processor.on("error", errorHandler);
processor.on("data", dataHandler);

processor.write(data, () => console.log('wrote data'));

processor.flush(() => {
    console.log('>> flush');
    processor.removeListener("error", errorHandler);
    processor.removeListener("data", dataHandler);

    let payload = Buffer.concat(chunks, length);

    console.log('>> includes', payload.includes(endBytes));
    console.log('>> compare', payload.slice(payload.length-4).compare(endBytes) === 0);

    // payload = payload.slice(0, payload.length - 4);


    console.log('>> resolve', Buffer.concat(chunks, length));
});



const processData = (processor: InflateRaw | DeflateRaw, data: Buffer) => new Promise<Buffer>((resolve, reject) => {
    // console.log('>> processData', data);
    const chunks = new Array<Buffer>();
    let length = 0;

    const errorHandler = err => {
        console.log('>> errorHandler', err);
        reject(err);
    };
    const dataHandler = chunk => {
        // console.log('>> dataHandler', chunk);
        chunks.push(chunk);
        length += chunk.length;
    };

    processor.on("error", errorHandler);
    processor.on("data", dataHandler);

    processor.write(data, null, () => console.log('wrote'));
    // console.log('>> write', data);
    const end = Buffer.from([0x00, 0x00, 0xff, 0xff]);

    processor.write(Buffer.from([0x00, 0x00, 0xff, 0xff]));

    processor.flush(() => {
        // console.log('>> flush');
        processor.removeListener("error", errorHandler);
        processor.removeListener("data", dataHandler);
        resolve(Buffer.concat(chunks, length));
    });
});

processData(zlib.createDeflateRaw(options), data).then(v => console.log('>> v', v));
