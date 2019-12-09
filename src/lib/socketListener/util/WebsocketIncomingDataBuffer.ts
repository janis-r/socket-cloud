import {Event, EventDispatcher, EventListener} from "qft";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {applyXorMask, decomposeHeader, getMaskBytes, read64BitPayloadLength} from "./websocket-utils";

export class WebsocketIncomingDataBuffer extends EventDispatcher {

    private chunks = new Array<Buffer>();
    private process: () => void | null = null;
    private _destroyed = false;

    constructor() {
        super();
        this.processNextFrame();
    }

    write(chunk: Buffer): void {
        if (!chunk || !(chunk instanceof Buffer)) {
            throw new Error(`This: (${chunk}) is not a Buffer! @WebsocketIncomingDataBuffer:write`);
        }

        if (this._destroyed) {
            throw new Error(`Writing: (${chunk}) is not allowed on destroyed instance! @WebsocketIncomingDataBuffer:write`);
        }

        console.log('>> write', chunk.length, 'bytes');

        this.chunks.push(chunk);
        if (this.process) {
            this.process();
        }
    }

    addEventListener(event: "data", listener: EventListener<Event<WebsocketDataFrame>>, scope?: Object);
    addEventListener(event: Event['type'], listener: EventListener, scope?: Object) {
        return super.addEventListener(event, listener, scope);
    }

    destroy(): void {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true
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
        // console.log('>> read', bytes, this.chunks.map(c => c.length + ' bytes'));
        const {chunks} = this;

        const output = Buffer.alloc(bytes);
        let bytesWritten = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const bytesToConsume = Math.min(chunk.length, bytes - bytesWritten);
            chunk.copy(output, bytesWritten, 0, bytesToConsume);
            chunks[i] = chunk.slice(bytesToConsume);
            // console.log({bytesToConsume, 'chunk.length': chunk.length});
            bytesWritten += bytesToConsume;
            if (bytesWritten === bytes) {
                break;
            }
        }

        while (chunks.length > 0 && chunks[0].length === 0) {
            chunks.splice(0, 1);
        }

        if (bytesWritten === bytes) {
            // console.log('>> return 1', output.length, 'bytes');
            return output;
        }

        await new Promise<void>(resolve => {
            // console.log('>> wait for', bytes - bytesWritten, 'bytes');
            this.process = () => {
                // console.log('>> resume');
                this.process = null;
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

        maskBytes && applyXorMask(payload, maskBytes);

        if (this._destroyed) {
            return;
        }

        this.dispatchEvent("data", {
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

