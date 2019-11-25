import {WebsocketExtension} from "./WebsocketExtension";
import {WebsocketExtensionExecutor} from "./WebsocketExtensionExecutor";
import {parseWebsocketExtensionOffers} from "../util";
import {Logger} from "../../logger";
import {Inject} from "qft";

export class WebsocketExtensionRegistry {

    @Inject()
    private readonly logger: Logger;

    private _knownExtensions = new Map<string, WebsocketExtension>();
    get knownExtensions(): ReadonlyMap<string, WebsocketExtension> {
        return this._knownExtensions;
    }

    /**
     * Add websocket extension to available extension list
     * @param extension
     */
    registerExtension(extension: WebsocketExtension): void {
        this._knownExtensions.set(extension.id, extension);
    }

    /**
     * Get list of websocket extension executors to be enabled for connection context by configuration offers
     * described by  Sec-WebSocket-Extensions header.
     * @param configOffers
     */
    getExtensionExecutorsForConfiguration(configOffers: string): WebsocketExtensionExecutor[] {
        const {knownExtensions} = this;
        const configurationOffers = parseWebsocketExtensionOffers(configOffers);

        console.log({configurationOffers});
        const executors: WebsocketExtensionExecutor[] = [];
        if (configurationOffers.size === 0) {
            return executors;
        }


        for (const [extensionName, config] of configurationOffers) {
            if (!knownExtensions.has(extensionName)) {
                continue;
            }
            const extensionExecutor = knownExtensions.get(extensionName).configure(...config);
            if (extensionExecutor) {
                executors.push(extensionExecutor);
            }
        }
        return executors;
    }
}
