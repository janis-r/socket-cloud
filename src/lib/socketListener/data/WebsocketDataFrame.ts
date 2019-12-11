import {WebsocketDataFrameType} from "./WebsocketDataFrameType";

export type WebsocketDataFrame = {
    type: WebsocketDataFrameType;
    isFinal: boolean;
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;
    payload: Buffer;
    /**
     * Defines if incoming data were masked for object that has been decomposed into value object and provides
     * instructions on how to render binary version of value object when it goes other way around
     */
    masked: boolean;
}

