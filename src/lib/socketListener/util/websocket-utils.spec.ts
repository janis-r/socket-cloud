import {composeWebsocketFrame, decomposeWebSocketFrame} from "./websocket-utils";
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
});
