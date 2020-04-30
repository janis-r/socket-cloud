import {Module} from "quiver-framework";
import {WebsocketExtensionModule} from "../websocketExtension/WebsocketExtensionModule";
import {WebsocketExtensionRegistry} from "../websocketExtension/service/WebsocketExtensionRegistry";
import {PermessageDeflateExtension} from "./service/PermessageDeflateExtension";

@Module({
    requires: [WebsocketExtensionModule],
    mappings: [PermessageDeflateExtension]
})
export class PermessageDeflateExtensionModule {
    constructor(registry: WebsocketExtensionRegistry, extension: PermessageDeflateExtension) {
        registry.registerExtension(extension);
    }
}
