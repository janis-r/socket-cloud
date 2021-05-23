import { ModuleConfig } from "quiver-framework";
import { WebsocketExtensionRegistry } from "./service/WebsocketExtensionRegistry";

export const WebsocketExtensionModule: ModuleConfig = {
    mappings: [
        WebsocketExtensionRegistry
    ]
};
