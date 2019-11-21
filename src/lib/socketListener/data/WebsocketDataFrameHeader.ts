import {WebsocketDataFrameType} from "./WebsocketDataFrameType";

export type WebsocketDataFrameHeader = {
    type: WebsocketDataFrameType,
    isFinal: boolean,
    maskingKey: number,
    payloadLength: number | bigint,
    payloadOffset: number,
    rsv1: boolean,
    rsv2: boolean,
    rsv3: boolean
};
