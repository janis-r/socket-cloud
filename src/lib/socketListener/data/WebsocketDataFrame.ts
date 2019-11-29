import {WebsocketDataFrameType} from "./WebsocketDataFrameType";

export type WebsocketDataFrame = {
    type: WebsocketDataFrameType;
    isFinal: boolean;
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;
    payload: Buffer;
}

export const createDataFrame = (type: WebsocketDataFrameType, {payload = null, isFinal = true, rsv1 = false, rsv2 = false, rsv3 = false}: Partial<WebsocketDataFrame> = {}): WebsocketDataFrame => ({
    type, payload, isFinal, rsv1, rsv2, rsv3
});
