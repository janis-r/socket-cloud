import {WebsocketDataFrameType} from "./WebsocketDataFrameType";

export type WebsocketDataFrame = {
    type: WebsocketDataFrameType;
    isFinal: boolean;
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;
    payload: Buffer;
}
