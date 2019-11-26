import {Command, Inject, Optional} from "qft";
import {WebsocketConnectionValidationRequest} from "../../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../../logger";
import {WebsocketExtensionRegistry} from "../../../websocketExtension";

export class PrepareWebsocketExtensions implements Command<false | never> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;

    @Inject()
    private readonly logger: Logger;

    @Inject()
    @Optional()
    private readonly websocketExtensionRegistry: WebsocketExtensionRegistry;

    execute(): false | never {
        const {
            logger: {error: logError},
            websocketExtensionRegistry,
            event,
            event: {
                request: {
                    headers: {
                        'sec-websocket-extensions': secWebsocketExtensions,
                    }
                },
                socket
            }
        } = this;

        if (!websocketExtensionRegistry) {
            // websocketExtensionRegistry and extensions are not present
            return;
        }

        try {
            event.extensions = websocketExtensionRegistry.getExtensionAgentsForConfiguration(secWebsocketExtensions);
        } catch ({error, stack}) {
            logError(`PrepareWebsocketExtensions err while validating configuration offer ${JSON.stringify({
                error,
                stack
            }, null, ' ')}`);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }
    }

}
