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

        const {
            configuration,
            configuration: {clientMaxWindowBits, serverMaxWindowBits, serverNoContextTakeover}
        } = this;

        const acceptableConfig = configs.find((config: PermessageDeflateExtensionConfig) => {
            if (isPermessagedeflateConfiguration(config) === false) {
                throw new Error(`Unsupported extension config format provided to permessage-deflate: ` + JSON.stringify(config));
            }
            const {
                client_max_window_bits, client_no_context_takeover, server_max_window_bits, server_no_context_takeover
            } = config.values;

            if (!serverNoContextTakeover && server_no_context_takeover) {
                return false;
            }

            if (!serverMaxWindowBits && server_max_window_bits) {
                return false;
            }
            if (server_max_window_bits > serverMaxWindowBits) {
                return false;
            }

            if (clientMaxWindowBits && !client_max_window_bits) {
                return false;
            }
            return true;

        });

        if (!acceptableConfig) {
            return null;
        }

        console.log({acceptableConfig});

        return new PermessageDeflateAgent(configuration, acceptableConfig);
    }
}

const isPermessagedeflateConfiguration = (config: WebsocketExtensionConfig): config is PermessageDeflateExtensionConfig => {
    if (!config.origin || typeof config.origin !== "string") {
        return false;
    }
    if (!config.values || typeof config.values !== "object") {
        return false;
    }

    for (const key of Object.keys(config.values)) {
        const value = config.values[key];
        if (!valueBelongsToEnum(PermessageDeflateParam, key)) {
            console.warn(`${key} is not known param of permessage-deflate extension`);
            return false;
        }
        if (key === PermessageDeflateParam.ClientMaxWindowBits && value === undefined) {
            // This is allowed setting
            continue;
        }
        if (key.match(/max_window_bits$/) && (typeof value !== "number" || !Number.isInteger(value) || value < 8 || value > 15)) {
            console.warn(`${key} value [${value}] is out of valid bounds in permessage-deflate extension config`);
            return false;
        }
        if (key.match(/no_context_takeover$/) && typeof value !== "boolean") {
            console.warn(`${key} value [${value}] must be boolean in permessage-deflate extension config`);
            return false;
        }
    }
    return true;
};
