import {Module} from "quiver-framework";
import {WebsocketExtensionModule, WebsocketExtensionRegistry} from "../websocketExtension";
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
