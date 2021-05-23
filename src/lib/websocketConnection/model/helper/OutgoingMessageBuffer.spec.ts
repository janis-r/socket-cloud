import { OutgoingMessageBuffer } from "./OutgoingMessageBuffer";
import { Socket } from "net";
import { decomposeWebSocketFrame, spawnFrameData } from "../../util/websocket-utils";
import { DataFrameType } from "../../data/DataFrameType";

describe("websocket outgoing data buffer", () => {

    let dataBuffer: OutgoingMessageBuffer;
    let socket: FakeSocket;

    beforeEach(() => {
        socket = new FakeSocket();
        dataBuffer = new OutgoingMessageBuffer(socket, [], 0);
    });

    it("Messages will be written in correct order", async () => {
        const payloads = ["1", "2", "3"].map(value => Buffer.from(value));
        for (const payload of payloads) {
            await dataBuffer.write(spawnFrameData(DataFrameType.TextFrame, { payload }));
        }

        expect(
            socket.chunksWritten
                .map(chunk => decomposeWebSocketFrame(chunk))
                .map(({ payload }) => payload)
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

