import { ModuleConfig } from "quiver-framework";
import { apiHubModule } from "../apiHub/apiHubModule";
import { MessageCacheApiListener } from "./service/MessageCacheApiListener";

export const messageCacheApiModule: ModuleConfig = {
    requires: [
        apiHubModule
    ],
    mappings: [
        { map: MessageCacheApiListener, instantiate: true }
    ]
}
