import {Command, Inject, Type} from "qft";
import {WebsocketConnectionValidationRequest} from "../../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../../logger";
import {parseWebsocketExtensions} from "../../util/websocket-utils";
import {WebsocketExtension} from "../../extension/WebsocketExtension";
import {PermessageDeflateExtension} from "../../extension/PermessageDeflateExtension";

export class PrepareWebsocketExtensions implements Command<boolean> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;

    @Inject()
    private readonly logger: Logger;

    private readonly knownExtensions = new Map<string, Type<WebsocketExtension>>([
        [PermessageDeflateExtension.ID, PermessageDeflateExtension]
    ]);

    execute(): boolean {
        const {
            logger: {error},
            event: {
                request: {
                    headers: {
                        'sec-websocket-extensions': secWebsocketExtensions,
                    },
                },
                socket,
                requestInfo
            },
            knownExtensions
        } = this;

        const extensions = parseWebsocketExtensions(secWebsocketExtensions);
        console.log(extensions);

        if (extensions.size === 0) {
            return true;
        }

        for (const [name, config] of extensions) {
            if (!knownExtensions.has(name)) {
                continue;
            }

            const extension = new (knownExtensions.get(name))();
            extension.validateConfigurationOffer(...config);
        }


        /*if (!originHeader && !secWebsocketOriginHeader) {
            error(`Websocket validation err - origin is not set in header`, requestInfo);
            socket.end("HTTP/1.1 400 Bad Request");
            return false;
        }*/

        return true;
    }

}
