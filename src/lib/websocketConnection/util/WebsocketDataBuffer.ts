import { DataFrame } from "../data/DataFrame";
import {
    applyXorMask,
    decomposeHeader,
    decomposeWebSocketFrame,
    getMaskBytes,
    read64BitPayloadLength
} from "./websocket-utils";
import chalk from "chalk";
import { CallbackCollection } from "../../utils/CallbackCollection";
import { debug } from "../model/WebsocketConnection";


/**
 * Utility class to buffer up websocket data until they make up full data frame.
 */
export class WebsocketDataBuffer {

    private dataCallback = new CallbackCollection<DataFrame>();
    private chunks = new Array<Buffer>();
    private process: () => void | null = null;
    private _destroyed = false;

    constructor() {
        this.processNextFrame();
    }

    /**
     * Frame data ready callback
     */
    readonly onData = this.dataCallback.manage;

    /**
     * Write chunk of binary data to websocket frame data buffer
     * @param chunk
     */
    write(chunk: Buffer): void {
        if (!chunk || !(chunk instanceof Buffer)) {
            throw new Error(`This: (${chunk}) is not a Buffer! @WebsocketIncomingDataBuffer:write`);
        }

        if (this._destroyed) {
            throw new Error(`Writing: (${decomposeWebSocketFrame(chunk)}) is not allowed on destroyed instance! @WebsocketIncomingDataBuffer:write`);
        }

        debug && console.log(chalk.blue('>> write to incoming buffer', chunk.length.toString(), 'bytes'));

        this.chunks.push(chunk);
        if (this.process) {
            this.process();
        }
    }

    destroy(): void {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true;
        this.process && this.process();
    }

    get destroyed(): boolean {
        return this._destroyed;
    }

    private readonly read = async (bytes: number): Promise<Buffer> => {
        if (this._destroyed) {
            // Return empty buffer of required length if this instance is destroyed
            return Buffer.alloc(bytes);
        }
        const { chunks } = this;

        const output = Buffer.alloc(bytes);
        let bytesWritten = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const bytesToConsume = Math.min(chunk.length, bytes - bytesWritten);
            chunk.copy(output, bytesWritten, 0, bytesToConsume);
            chunks[i] = chunk.slice(bytesToConsume);
            bytesWritten += bytesToConsume;
            if (bytesWritten === bytes) {
                break;
            }
        }

        while (chunks.length > 0 && chunks[0].length === 0) {
            chunks.splice(0, 1);
        }

        if (bytesWritten === bytes) {
            return output;
        }

        await new Promise<void>(resolve => {
            this.process = () => {
                this.process = null;
                resolve();
            };
        });

        return Buffer.concat([output.slice(0, bytesWritten), await this.read(bytes - bytesWritten)])
    };

    private async processNextFrame(): Promise<void> {
        const { read, dataCallback: { execute: dispatchFrame } } = this;
        const { type, isFinal, rsv1, rsv2, rsv3, masked, payloadLength } = decomposeHeader(await read(2));

        let extendedPayloadLength: number;
        if (payloadLength === 126) {
            extendedPayloadLength = (await read(2)).readUInt16BE(0);
        } else if (payloadLength === 127) {
            extendedPayloadLength = read64BitPayloadLength(await read(8));
        }

        const maskBytes = masked ? getMaskBytes(await read(4)) : null;
        const payload = await read(extendedPayloadLength ?? payloadLength);
        maskBytes && applyXorMask(payload, maskBytes);
        if (this._destroyed) {
            return;
        }

        dispatchFrame({ type, isFinal, rsv1, rsv2, rsv3, payload, masked });
        this.processNextFrame();
    }
}

