import {WebsocketOutgoingDataBuffer} from "./WebsocketOutgoingDataBuffer";
import {Socket} from "net";
import {decomposeWebSocketFrame, spawnFrameData} from "../../util/websocket-utils";
import {WebsocketDataFrameType} from "../../data/WebsocketDataFrameType";
import {WebsocketDataFrame} from "../../data/WebsocketDataFrame";

describe("websocket outgoing data buffer", () => {

    let dataBuffer: WebsocketOutgoingDataBuffer;
    let socket: FakeSocket;

    beforeEach(() => {
        socket = new FakeSocket();
        dataBuffer = new WebsocketOutgoingDataBuffer(socket);
    });

    it("Messages will be written in correct order", async () => {
        const payloads = ["1", "2", "3"].map(value => Buffer.from(value));
        for (const payload of payloads) {
            await dataBuffer.write(spawnFrameData(WebsocketDataFrameType.TextFrame, {payload}));
        }

        expect(
            socket.chunksWritten
                .map(chunk => decomposeWebSocketFrame(chunk))
                .map(({payload}) => payload)
        ).toMatchObject(payloads);
    });

    it("Messages will be written in correct order even if some of them are async", async () => {
        const payloads = ["1", "2", "3"].map(value => Buffer.from(value));
        const awaitTimes = [3000, 0, 1000];
        for (const payload of payloads) {
            const time = awaitTimes.shift();
            if (!time) {
                await dataBuffer.write(spawnFrameData(WebsocketDataFrameType.TextFrame, {payload}));
                return;
            }

            await dataBuffer.write(
                new Promise<WebsocketDataFrame>(resolve => setTimeout(
                    () => resolve(spawnFrameData(WebsocketDataFrameType.TextFrame, {payload})),
                    time
                ))
            );
        }
        console.log('>> chunksWritten', socket.chunksWritten);
        expect(
            socket.chunksWritten
                .map(chunk => decomposeWebSocketFrame(chunk))
                .map(({payload}) => payload)
        ).toMatchObject(payloads);
    });
});

class FakeSocket extends Socket {
    readonly chunksWritten = new Array<Buffer>();

    get writable() {
        return true;
    }

    set writable(v: boolean) {

    }

    write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
    write(str: Uint8Array | string, encoding?: string, cb?: (err?: Error) => void): boolean;
    write(data, encoding?: string | ((err?: Error) => void), cb?: (err?: Error) => void): boolean {
        this.chunksWritten.push(data);
        return true;
    }

    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return this;
    }
}

