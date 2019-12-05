import {WebsocketDataFrameType} from "./WebsocketDataFrameType";

export type WebsocketDataFrame = {
    type: WebsocketDataFrameType;
    isFinal: boolean;
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;
    payload: Buffer;
}

const emptyBuffer = Buffer.alloc(0);

export const createDataFrame = (
    type: WebsocketDataFrameType, {
        payload = emptyBuffer,
        isFinal = true,
        rsv1 = false,
        rsv2 = false,
        rsv3 = false
    }: Partial<Exclude<WebsocketDataFrame, "type">> = {}): WebsocketDataFrame => ({
    type, payload, isFinal, rsv1, rsv2, rsv3
});
