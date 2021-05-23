import { Command, Inject, Optional } from "quiver-framework";
import { WebsocketConnectionValidationRequest } from "../../event/WebsocketConnectionValidationRequest";
import { Logger } from "../../../logger/service/Logger";
import { WebsocketExtensionRegistry } from "../../../websocketExtension/service/WebsocketExtensionRegistry";

export class PrepareWebsocketExtensions implements Command<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;

    @Inject()
    private readonly logger: Logger;

    @Inject()
    @Optional()
    private readonly websocketExtensionRegistry: WebsocketExtensionRegistry;

    execute() {
        const {
            logger: { error: logError },
            websocketExtensionRegistry,
            event,
            event: {
                request: {
                    headers: {
                        'sec-websocket-extensions': secWebsocketExtensions,
                    }
                },
                configurationContext: { compressData },
                socket
            }
        } = this;

        if (!websocketExtensionRegistry) {
            // websocketExtensionRegistry and extensions are not present
            return true;
        }

        if (!compressData) {
            // compression is disabled by configuration context
            return true;
        }

        try {
            event.extensions = websocketExtensionRegistry.getExtensionAgentsForConfiguration(secWebsocketExtensions);
        } catch ({ error, stack }) {
            logError(`PrepareWebsocketExtensions err while validating configuration offer ${JSON.stringify({
                error,
                stack
            }, null, ' ')}`);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }

        return true;
    }

}
