export class PermessageDeflateExtension {

    static readonly ID = "permessage-deflate";

    constructor() {

    }
}

enum PermessageDeflateParams {
    ServerNoContextTakeover = "server_no_context_takeover",
    ClientNoContextTakeover = "client_no_context_takeover",
    ServerMaxWindowBits = "server_max_window_bits",
    ClientMaxWindowBits = "client_max_window_bits"
}
