import {WebsocketDataFrameHeader} from "./WebsocketDataFrameHeader";

export type WebsocketDataFrame = {
    readonly header: WebsocketDataFrameHeader;
    readonly payload: Buffer;
}
