import {WebsocketExtensionConfig} from "../config/WebsocketExtensionConfig";
import {WebsocketExtensionAgent} from "./WebsocketExtensionAgent";

export interface WebsocketExtension {
    /**
     * String id of extension
     */
    readonly id: string;

    /**
     * Validate configuration offers, provided by client, and return confgured executor if any of offers is acceptable
     * and extension should be enabled.
     * (This method will throw an error in case provided params are out or valid bounds.)
     * @param configs
     */
    configure(...configs: WebsocketExtensionConfig[]): null | WebsocketExtensionAgent;
}
