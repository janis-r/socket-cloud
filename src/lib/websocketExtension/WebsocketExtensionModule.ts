import { ModuleConfig } from "qft";
import {WebsocketExtensionRegistry} from "./service/WebsocketExtensionRegistry";

export const WebsocketExtensionModule: ModuleConfig = {
    mappings: [
        WebsocketExtensionRegistry
    ]
};
