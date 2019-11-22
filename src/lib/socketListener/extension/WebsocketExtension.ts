import {WebsocketExtensionConfig} from "../data/WebsocketExtensionConfig";

export interface WebsocketExtension {

    validateConfigurationOffer(...configs: WebsocketExtensionConfig[]): void;

}
