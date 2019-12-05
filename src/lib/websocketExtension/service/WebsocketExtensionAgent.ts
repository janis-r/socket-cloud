import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";

export interface WebsocketExtensionAgent {
    /**
     * Websocket configuration offer (that enabled current agent) response string.
     */
    readonly configOfferResponse: string;

    /**
     * Transformation action to be applied on incoming data frame
     * @param dataFrames Incoming data frame - a single frame or collection of frames with data frame
     * followed by continuation frames.
     */
    transformIncomingData?(dataFrames: WebsocketDataFrame[]): WebsocketDataFrame[] | Promise<WebsocketDataFrame[]>;

    /**
     * Transformation action to be applied on outgoing data frame
     * @param dataFrames Outgoing data frame - a single frame or collection of frames with data frame
     * followed by continuation frames.
     */
    transformOutgoingData?(dataFrames: WebsocketDataFrame[]): WebsocketDataFrame[] | Promise<WebsocketDataFrame[]>;
}

// type DataFrameOrCollectionOfFrames = WebsocketDataFrame | WebsocketDataFrame[];
