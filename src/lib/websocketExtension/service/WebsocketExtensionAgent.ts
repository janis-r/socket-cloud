import {DataFrame} from "../../websocketConnection/data/DataFrame";


export interface WebsocketExtensionAgent {
    /**
     * Websocket configuration offer (that enabled current agent) response string.
     */
    readonly configOfferResponse: string;

    /**
     * Transformation action to be applied on incoming data frame
     * @param dataFrame Incoming data frame
     * followed by continuation frames.
     */
    incomingDataPipe?(dataFrame: DataFrame): DataFrame | Promise<DataFrame>;

    /**
     * Transformation action to be applied on outgoing data frame
     * @param dataFrame Outgoing data frame
     * followed by continuation frames.
     */
    outgoingDataPipe?(dataFrame: DataFrame): DataFrame | Promise<DataFrame>;
}
