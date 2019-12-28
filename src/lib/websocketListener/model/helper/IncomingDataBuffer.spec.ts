import {IncomingDataBuffer} from "./IncomingDataBuffer";
import {DataFrame} from "../../data/DataFrame";

describe("websocket incoming data buffer", () => {
    
    it("Can read fragmented messages", async () => {
        const messageBytes = [0x01, 0x89, 0x50, 0x99, 0xa0, 0xc8, 0x36, 0xeb, 0xc1, 0xaf, 0x3d, 0xfc, 0xce, 0xbc, 0x61, 0x80, 0x89, 0x72, 0x09, 0x10, 0xea, 0x14, 0x7b, 0x71, 0x8d, 0x1f, 0x6c, 0x7e, 0x9e, 0x40];
        const encodedFrame = {
            type: 1,
            isFinal: false,
            rsv1: false,
            rsv2: false,
            rsv3: false,
            payload: "fragment1fragment2"
        };

        const parsedMessages = new Array<DataFrame>();
        const dataBuffer = new IncomingDataBuffer();
        dataBuffer.onData(dataFrame => parsedMessages.push(dataFrame));
        dataBuffer.write(Buffer.from(messageBytes));

        await new Promise<void>(resolve => setTimeout(resolve, 10));
        expect(parsedMessages.length).toBe(2);
        expect(
            {
                ...parsedMessages[0],
                payload: Buffer.concat(parsedMessages.map(({payload}) => payload)).toString("utf8")
            }
        ).toMatchObject(encodedFrame);
    });

});
