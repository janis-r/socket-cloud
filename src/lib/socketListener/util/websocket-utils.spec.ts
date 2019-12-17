import {composeWebsocketFrame, decomposeWebSocketFrame, fragmentWebsocketFrame} from "./websocket-utils";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";

describe("websocket-utils", () => {

    it("Can compose and decompose websocket frame", () => {
        const dataFrame: WebsocketDataFrame = {
            type: WebsocketDataFrameType.TextFrame,
            isFinal: true,
            rsv1: false,
            rsv2: true,
            rsv3: false,
            payload: Buffer.from("message"),
            masked: false
        };

        let encoded: Buffer;
        expect(() => encoded = composeWebsocketFrame(dataFrame)).not.toThrowError();
        expect(decomposeWebSocketFrame(encoded)).toMatchObject(dataFrame);
    });

    it("Can compose and decompose masked websocket frame", () => {
        const dataFrame: WebsocketDataFrame = {
            type: WebsocketDataFrameType.TextFrame,
            isFinal: true,
            rsv1: false,
            rsv2: true,
            rsv3: false,
            payload: Buffer.from("message"),
            masked: true
        };

        let encoded: Buffer;
        expect(
            () => encoded = composeWebsocketFrame({
                ...dataFrame,
                payload: Buffer.from(dataFrame.payload) // This line is de-referencing payload before Buffer operations
            })
        ).not.toThrowError();

        let decodedFrame: WebsocketDataFrame;
        expect(() => decodedFrame = decomposeWebSocketFrame(encoded)).not.toThrowError();
        expect(decodedFrame).toMatchObject(dataFrame);
    });

    it('Can fragment data frame', () => {
        const chunkSize = 10;
        const numChunks = 3;
        const bigFrameData: WebsocketDataFrame = {
            type: WebsocketDataFrameType.TextFrame,
            isFinal: true,
            rsv1: true,
            rsv2: false,
            rsv3: false,
            payload: Buffer.from(new Array(chunkSize * numChunks).fill("*").join("")),
            masked: true
        };
        const fragments = fragmentWebsocketFrame(bigFrameData, chunkSize);

        expect(fragments.length).toBe(numChunks);
        expect(fragments.some(({payload}) => payload.length !== chunkSize)).toBe(false);

        const {type: bigType, rsv1: bigRsv1, rsv2: bigRsv2, rsv3: bigRsv3} = bigFrameData;
        fragments.forEach(({type, rsv1, rsv2, rsv3}, index) => {
            if (index === 0) {
                expect([bigType, bigRsv1, bigRsv2, bigRsv3,]).toMatchObject([type, rsv1, rsv2, rsv3]);
            } else {
                expect([bigType, bigRsv1, bigRsv2, bigRsv3]).not.toMatchObject([type, rsv1, rsv2, rsv3]);
            }
        });

        expect(fragments.slice(0, fragments.length - 1).some(({isFinal}) => isFinal)).toBe(false);
        expect(fragments[fragments.length - 1].isFinal).toBe(true);

    });
});
