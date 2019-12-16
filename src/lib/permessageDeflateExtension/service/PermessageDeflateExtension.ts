import {Inject} from "qft";
import {valueBelongsToEnum} from "ugd10a";
import {PermessageDeflateConfig} from "../config/PermessageDeflateConfig";
import {WebsocketExtension, WebsocketExtensionAgent, WebsocketExtensionConfig} from "../../websocketExtension";
import {PermessageDeflateParam} from "../data/PermessageDeflateParam";
import {PermessageDeflateAgent} from "./PermessageDeflateAgent";
import {PermessageDeflateExtensionConfig} from "../data/PermessageDeflateExtensionConfig";
import * as zlib from "zlib";

export class PermessageDeflateExtension implements WebsocketExtension {

    readonly id = "permessage-deflate";

    @Inject()
    private readonly configuration: PermessageDeflateConfig;

    configure(...configs: WebsocketExtensionConfig[]): null | WebsocketExtensionAgent {
        if (!configs || configs.length === 0) {
            throw new Error(`Empty configs provided to permessage-deflate extension`);
        }

        const {constants: {Z_DEFAULT_WINDOWBITS}} = zlib;

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
            configOfferResponseValues.client_max_window_bits = clientConfigOffer.client_max_window_bits ?? configuration.clientMaxWindowBits ?? Z_DEFAULT_WINDOWBITS;
        }

        if (PermessageDeflateParam.ServerMaxWindowBits in clientConfigOffer) {
            configOfferResponseValues.server_max_window_bits = clientConfigOffer.server_max_window_bits ?? configuration.serverMaxWindowBits ?? Z_DEFAULT_WINDOWBITS;
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
        Object.keys(configOfferResponseValues).forEach(key => {
            const value = configOfferResponseValues[key];
            if (typeof value === "number") {
                response.push(`${key}=${value}`);
            } else {
                // Boolean properties like \w+_no_context_takeover are enabled by just listing propety so true values
                // can be omitted in here, which leaves us with only number value to be included
                response.push(`${key}`);
            }
        });
        // console.log({configuration, clientConfigOffer, configOfferResponseValues})
        return new PermessageDeflateAgent({
            peerWindowBits: configOfferResponseValues.client_max_window_bits,
            ownWindowBits: configOfferResponseValues.server_max_window_bits,
            allowPeerContextTakeover: !!configOfferResponseValues.client_no_context_takeover,
            allowOwnContextTakeover: !!configOfferResponseValues.server_no_context_takeover,
        }, response.join(';'));
    }
}

const validateConfiguration = (config: WebsocketExtensionConfig): PermessageDeflateExtensionConfig | null => {
    console.log('>> validateConfiguration', config);
    // permessage-deflate;client_no_context_takeover;client_max_window_bits=15
    if (!config.origin || typeof config.origin !== "string") {
        return null;
    }
    if (!config.values || typeof config.values !== "object") {
        return null;
    }

    const keys = Object.keys(config.values);
    const keyIsSet = key => keys.includes(key);
    const getValue = key => config.values[key];
    const {ClientMaxWindowBits, ServerMaxWindowBits, ClientNoContextTakeover, ServerNoContextTakeover} = PermessageDeflateParam;
    console.log(config);

    // permessage-deflate;client_no_context_takeover;client_max_window_bits=15
    /*const configValues: PermessageDeflateExtensionConfig['values'] = {
        client_no_context_takeover: true,
        client_max_window_bits:15
    };*/
    const configValues: PermessageDeflateExtensionConfig['values'] = {};
    if (keyIsSet(ClientMaxWindowBits)) {
        const value = getValue(ClientMaxWindowBits);
        if (typeof value !== "string") {
            configValues.client_max_window_bits = value;
        }
    }
    if (keyIsSet(ServerMaxWindowBits)) {
        const value = getValue(ServerMaxWindowBits);
        if (typeof value !== "string") {
            configValues.server_max_window_bits = value;
        }
    }
    if (keyIsSet(ClientNoContextTakeover)) {
        configValues.client_no_context_takeover = true;
    }
    if (keyIsSet(ServerNoContextTakeover)) {
        configValues.server_no_context_takeover = true;
    }

    for (const key of Object.keys(configValues)) {
        const value = configValues[key];
        if (!valueBelongsToEnum(PermessageDeflateParam, key)) {
            console.warn(`${key} is not known param of permessage-deflate extension`);
            return null;
        }
        if (key === ClientMaxWindowBits && value === undefined) {
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
    // console.log({configValues});
    // process.exit();
    return {
        ...config,
        values: configValues
    };
};
