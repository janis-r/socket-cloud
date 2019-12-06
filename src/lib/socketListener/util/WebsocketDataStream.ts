import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {applyXorMask} from "./websocket-utils";

export class WebsocketDataStream {

    private chunks = new Array<Buffer | null>();
    private resumeCall: () => void | null = null;

    constructor(private readonly dataCallback: (data: WebsocketDataFrame) => void) {
        this.processNextFrame();
    }

    write(chunk: Buffer): void {
        if (!chunk || !(chunk instanceof Buffer)) {
            throw new Error(`This: (${chunk}) is not a Buffer! @WebsocketDataStream:write`);
        }

        console.log('>> write', chunk.length, 'bytes');

        this.chunks.push(chunk);

        if (this.resumeCall) {
            this.resumeCall();
        }
    }

    private readonly read = async (bytes: number): Promise<Buffer> => {
        // console.log('>> read', bytes, this.chunks.map(c => c.length + ' bytes'));
        const {chunks} = this;

        const output = Buffer.alloc(bytes);
        let bytesWritten = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const bytesToConsume = Math.min(chunk.length, bytes - bytesWritten);
            chunk.copy(output, bytesWritten, 0, bytesToConsume);
            chunks[i] = bytesToConsume === chunk.length ? null : chunk.slice(bytesToConsume);
            // console.log({bytesToConsume, 'chunk.length': chunk.length});
            bytesWritten += bytesToConsume;
            if (bytesWritten === bytes) {
                break;
            }
        }

        this.chunks = chunks.filter(e => !!e);
        if (bytesWritten === bytes) {
            // console.log('>> return 1', output.length, 'bytes');
            return output;
        }

        await new Promise<void>(resolve => {
            // console.log('>> wait for', bytes - bytesWritten, 'bytes');
            this.resumeCall = () => {
                // console.log('>> resume');
                this.resumeCall = null;
                resolve();
            }
        });

        const combinedOutput = Buffer.concat([output.slice(0, bytesWritten), await this.read(bytes - bytesWritten)]);
        // console.log('>> return 2', combinedOutput.length, 'bytes');
        return combinedOutput
    };

    private async processNextFrame(): Promise<void> {
        const {read} = this;
        const {type, isFinal, rsv1, rsv2, rsv3, masked, payloadLength} = decomposeHeader(await read(2));
        // console.log('>> header', header);

        let extendedPayloadLength: number;
        if (payloadLength === 126) {
            extendedPayloadLength = (await read(2)).readUInt16BE(0);
        } else if (payloadLength === 127) {
            extendedPayloadLength = read64BitPayloadLength(await read(8));
        }
        // console.log('>> extendedPayloadLength', extendedPayloadLength);

        const maskBytes = masked ? getMaskBytes(await read(4)) : null;
        // console.log('>> maskBytes', maskBytes);

        const payload = await read(extendedPayloadLength ?? payloadLength);
        // console.log('>> payload', payload.length, 'bytes');

        applyXorMask(payload, maskBytes);

        this.dataCallback({
            type,
            isFinal,
            rsv1,
            rsv2,
            rsv3,
            payload
        });

        this.processNextFrame();
    }
}

function decomposeHeader(data: Buffer): { type: WebsocketDataFrameType, isFinal: boolean, rsv1: boolean, rsv2: boolean, rsv3: boolean, payloadLength: number, masked: boolean } {
    const firstByte = data.readUInt8(0);
    const [type, isFinal, rsv1, rsv2, rsv3] = [
        firstByte & 0xF,
        !!((firstByte >>> 7) & 0x1),
        !!((firstByte >>> 6) & 0x1),
        !!((firstByte >>> 5) & 0x1),
        !!((firstByte >>> 4) & 0x1)
    ];
    const secondByte = data.readUInt8(1);
    const payloadLength = secondByte & 0x7F;
    const masked = !!((secondByte >>> 7) & 0x1);
    return {type, isFinal, rsv1, rsv2, rsv3, payloadLength, masked};
}

function read64BitPayloadLength(data: Buffer): number {
    const leftPart = data.readUInt32BE(0);
    // Check if payload length is within bounds of Number in jS (bigint could actually help here?)
    if (leftPart > (2 ** 21) - 1) {
        throw new Error(`Payload length is too big`);
    }
    return leftPart * (2 ** 32) + data.readUInt32BE(4);
}

function getMaskBytes(buffer: Buffer): Array<number> {
    const maskInt32 = buffer.readUInt32BE(0);
    return [(maskInt32 >> 24) & 0xFF, (maskInt32 >> 16) & 0xFF, (maskInt32 >> 8) & 0xFF, maskInt32 & 0xFF];
}
