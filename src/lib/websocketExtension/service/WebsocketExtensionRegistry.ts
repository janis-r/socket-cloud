import {Inject} from "qft";
import {Logger} from "../../logger";
import {WebsocketExtension} from "./WebsocketExtension";
import {parseWebsocketExtensionOffers} from "../util/parse-websocket-extension-offers";
import {WebsocketExtensionAgent} from "./WebsocketExtensionAgent";

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
     * Get list of websocket extension execution agents to be enabled for connection context by configuration offers
     * described by  Sec-WebSocket-Extensions header.
     * @param configOffers
     */
    getExtensionAgentsForConfiguration(configOffers: string): WebsocketExtensionAgent[] {
        const {knownExtensions} = this;
        const configurationOffers = parseWebsocketExtensionOffers(configOffers);
        const agents: WebsocketExtensionAgent[] = [];
        if (configurationOffers.size === 0) {
            return agents;
        }

        for (const [extensionName, config] of configurationOffers) {
            if (!knownExtensions.has(extensionName)) {
                continue;
            }
            const extensionAgent = knownExtensions.get(extensionName).configure(...config);
            if (extensionAgent) {
                agents.push(extensionAgent);
            }
        }
        return agents;
    }
}
