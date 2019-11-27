import {WebsocketExtensionConfig} from "..";
import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";

export interface WebsocketExtensionAgent {
    /**
     * Information on extension configuration that has enabled particular agent.
     */
    readonly config: WebsocketExtensionConfig;

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
