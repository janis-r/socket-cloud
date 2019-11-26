import {WebsocketExtensionConfig} from "..";

export interface WebsocketExtensionAgent {
    /**
     * Information on extension configuration that has enabled particular agent.
     */
    readonly config: WebsocketExtensionConfig;

    /**
     * Transformation action to be applied on incoming data frame payload
     * @param payload
     */
    transformIncomingData?(payload: Buffer): Buffer | Promise<Buffer>;
}
