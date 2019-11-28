import {Inject} from "qft";
import {valueBelongsToEnum} from "ugd10a";
import {PermessageDeflateConfig} from "../config/PermessageDeflateConfig";
import {WebsocketExtension, WebsocketExtensionAgent, WebsocketExtensionConfig} from "../../websocketExtension";
import {PermessageDeflateParam} from "../data/PermessageDeflateParam";
import {PermessageDeflateAgent} from "./PermessageDeflateAgent";
import {PermessageDeflateExtensionConfig} from "../data/PermessageDeflateExtensionConfig";

export class PermessageDeflateExtension implements WebsocketExtension {

    readonly id = "permessage-deflate";

    @Inject()
    private readonly configuration: PermessageDeflateConfig;

    configure(...configs: WebsocketExtensionConfig[]): null | WebsocketExtensionAgent {
        if (!configs || configs.length === 0) {
            throw new Error(`Empty configs provided to permessage-deflate extension`);
        }

        const {configuration} = this;
        const permessageDeflateExtensionConfigs = configs.map(config => {
            const validatedConfig = validateConfiguration(config);
            if (!validatedConfig) {
                throw new Error(`Unsupported extension config format provided to permessage-deflate: ` + JSON.stringify(config));
            }
            return validatedConfig;
        });

        /**
         * TODO: Config validation and picking best config out of list of available ones seems to be wide topic to cover later
         */
        const acceptableConfig = permessageDeflateExtensionConfigs[0];

        const {values: clientConfigOffer} = acceptableConfig;
        const configOfferResponseValues: PermessageDeflateExtensionConfig['values'] = {};

        // Missing client_max_window_bits key indicate that client is not supporting this property, so it will be left
        // out from response
        if (PermessageDeflateParam.ClientMaxWindowBits in clientConfigOffer) {
            const value = clientConfigOffer.client_max_window_bits ?? configuration.clientMaxWindowBits;
            if (value) {
                configOfferResponseValues.client_max_window_bits = value;
            }
        }

        const serverMaxWindowBits = clientConfigOffer.server_max_window_bits ?? configuration.serverMaxWindowBits;
        if (serverMaxWindowBits) {
            configOfferResponseValues.server_max_window_bits = serverMaxWindowBits;
        }

        const clientNoContextTakeover = clientConfigOffer.client_no_context_takeover ?? configuration.clientNoContextTakeover;
        if (clientNoContextTakeover) {
            configOfferResponseValues.client_no_context_takeover = clientNoContextTakeover;
        }

        const serverNoContextTakeover = clientConfigOffer.server_no_context_takeover ?? configuration.serverNoContextTakeover;
        if (serverNoContextTakeover) {
            configOfferResponseValues.server_no_context_takeover = serverNoContextTakeover;
        }

        const response = [this.id];
        Object.keys(configOfferResponseValues).forEach(key => response.push(`${key}=${configOfferResponseValues[key]}`));

        return new PermessageDeflateAgent({
            peerWindowBits: configOfferResponseValues.client_max_window_bits,
            ownWindowBits: configOfferResponseValues.server_max_window_bits,
            allowPeerContextTakeover: !!configOfferResponseValues.client_no_context_takeover,
            allowOwnContextTakeover: !!configOfferResponseValues.server_no_context_takeover,
        }, response.join(';'));
    }
}

const validateConfiguration = (config: WebsocketExtensionConfig): PermessageDeflateExtensionConfig | null => {
    if (!config.origin || typeof config.origin !== "string") {
        return null;
    }
    if (!config.values || typeof config.values !== "object") {
        return null;
    }

    for (const key of Object.keys(config.values)) {
        const value = config.values[key];
        if (!valueBelongsToEnum(PermessageDeflateParam, key)) {
            console.warn(`${key} is not known param of permessage-deflate extension`);
            return null;
        }
        if (key === PermessageDeflateParam.ClientMaxWindowBits && value === undefined) {
            // This is allowed setting
            continue;
        }
        if (key.match(/max_window_bits$/) && (typeof value !== "number" || !Number.isInteger(value) || value < 8 || value > 15)) {
            console.warn(`${key} value [${value}] is out of valid bounds in permessage-deflate extension config`);
            return null;
        }
        if (key.match(/no_context_takeover$/) && typeof value !== "boolean") {
            console.warn(`${key} value [${value}] must be boolean in permessage-deflate extension config`);
            return null;
        }
    }
    return config as PermessageDeflateExtensionConfig;
};
