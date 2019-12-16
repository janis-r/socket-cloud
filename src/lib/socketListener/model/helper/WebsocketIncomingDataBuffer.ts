import {Event, EventDispatcher, EventListener} from "qft";
import {WebsocketDataFrame} from "../../data/WebsocketDataFrame";
import {
    applyXorMask,
    decomposeHeader,
    decomposeWebSocketFrame,
    getMaskBytes,
    read64BitPayloadLength
} from "../../util/websocket-utils";
import chalk from "chalk";

/**
 * Utility class to buffer up incoming websocket data until they make up full data frame.
 */
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
            throw new Error(`Writing: (${decomposeWebSocketFrame(chunk)}) is not allowed on destroyed instance! @WebsocketIncomingDataBuffer:write`);
        }

        console.log(chalk.blue('>> write to incoming buffer', chunk.length.toString(), 'bytes'));

        this.chunks.push(chunk);
        if (this.process) {
            this.process();
        }
    }

    addEventListener(event: "data", listener: EventListener<Event<WebsocketDataFrame>>, scope?: Object);
    addEventListener(event: Event['type'], listener: EventListener<any>, scope?: Object) {
        return super.addEventListener(event, listener, scope);
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
        const {chunks} = this;

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
        const {read} = this;
        const {type, isFinal, rsv1, rsv2, rsv3, masked, payloadLength} = decomposeHeader(await read(2));

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

