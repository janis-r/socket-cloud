import {WebsocketExtensionConfig} from "../data/WebsocketExtensionConfig";
import {WebsocketExtension} from "./WebsocketExtension";

export class PermessageDeflateExtension implements WebsocketExtension {

    static readonly ID = "permessage-deflate";

    validateConfigurationOffer(...configs: WebsocketExtensionConfig[]): void {

    }

}

enum PermessageDeflateParams {
    ServerNoContextTakeover = "server_no_context_takeover",
    ClientNoContextTakeover = "client_no_context_takeover",
    ServerMaxWindowBits = "server_max_window_bits",
    ClientMaxWindowBits = "client_max_window_bits"
}
