import {WebsocketExtensionConfig} from "..";
import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";

export interface WebsocketExtensionAgent {
    /**
     * Websocket configuration offer (that enabled current agent) response string.
     */
    readonly configOfferResponse: string;

    /**
     * Transformation action to be applied on incoming data frame
     * @param dataFrame
     */
    transformIncomingData?(dataFrame: WebsocketDataFrame): WebsocketDataFrame | Promise<WebsocketDataFrame>;

    /**
     * Transformation action to be applied on outgoing data frame
     * @param dataFrame
     */
    transformOutgoingData?(dataFrame: WebsocketDataFrame): WebsocketDataFrame | Promise<WebsocketDataFrame>;
}
