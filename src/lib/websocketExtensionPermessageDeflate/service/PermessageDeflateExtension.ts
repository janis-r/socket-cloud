import {Inject} from "qft";
import {valueBelongsToEnum} from "ugd10a";
import {PermessageDeflateConfig} from "../config/PermessageDeflateConfig";
import {WebsocketExtension, WebsocketExtensionConfig, WebsocketExtensionExecutor} from "../../websocketExtension";
import {PermessageDeflateParam} from "../data/PermessageDeflateParam";
import {PermessageDeflateExecutor} from "./PermessageDeflateExecutor";

export class PermessageDeflateExtension implements WebsocketExtension {

    readonly id = "permessage-deflate";

    @Inject()
    private readonly configuration: PermessageDeflateConfig;

    configure(...configs: WebsocketExtensionConfig[]): null | WebsocketExtensionExecutor {
        // console.log(configs);
        // process.exit()
        if (!configs || configs.length === 0) {
            throw new Error(`Empty configs provided to permessage-deflate extension`);
        }

        configs.forEach(validateConfiguration);

        const {
            configuration,
            configuration: {
                clientMaxWindowBits: configClientMaxWindowBits,
                serverMaxWindowBits: configServerMaxWindowBits,
                serverNoContextTakeover: configServerNoContextTakeover
            }
        } = this;

        const acceptableConfig = configs.find(offer => {
            const offerServerNoContextTakeover = offer.get(PermessageDeflateParam.ServerNoContextTakeover);
            if (!configServerNoContextTakeover && offerServerNoContextTakeover) {
                return false;
            }

            const offerServerMaxWindowBits = offer.get(PermessageDeflateParam.ServerMaxWindowBits);
            if (!configServerMaxWindowBits && offerServerMaxWindowBits) {
                return false;
            }
            if (configServerMaxWindowBits > offerServerMaxWindowBits) {
                return false;
            }

            const offerClientMaxWindowBits = offer.get(PermessageDeflateParam.ClientMaxWindowBits);
            if (configClientMaxWindowBits && !offerClientMaxWindowBits) {
                return false;
            }
            return true;
        });

        if (!acceptableConfig) {
            return null;
        }

        const connectionConfig: PermessageDeflateConfig = {};
        /*<[PermessageDeflateParam, keyof PermessageDeflateConfig][]>*/
        [
            [PermessageDeflateParam.ServerMaxWindowBits, 'serverMaxWindowBits'],
            [PermessageDeflateParam.ClientMaxWindowBits, 'clientMaxWindowBits'],
            [PermessageDeflateParam.ClientNoContextTakeover, 'clientNoContextTakeover'],
            [PermessageDeflateParam.ServerNoContextTakeover, 'serverNoContextTakeover'],
        ].forEach(([rawKey, propName]) => {
            if (acceptableConfig.has(rawKey)) {
                connectionConfig[propName] = acceptableConfig.get(rawKey)
            }
        });

        console.log({acceptableConfig, connectionConfig});

        return new PermessageDeflateExecutor(configuration, connectionConfig);
    }
}

const validateConfiguration = (config: WebsocketExtensionConfig): true => {
    for (const [key, value] of config) {
        if (!valueBelongsToEnum(PermessageDeflateParam, key)) {
            throw new Error(`${key} is not known param of permessage-deflate extension`);
        }

        if (key === PermessageDeflateParam.ClientMaxWindowBits && value === undefined) {
            // This is allowed setting
            continue;
        }

        if (key.match(/max_window_bits$/) && (
            typeof value !== "number" ||
            !Number.isInteger(value) ||
            value < 8 || value > 15
        )) {
            throw new Error(`${key} value [${value}] is out of valid bounds in permessage-deflate extension config`);
        }
        if (key.match(/no_context_takeover$/) && typeof value !== "boolean") {
            throw new Error(`${key} value [${value}] must be boolean in permessage-deflate extension config`);
        }
    }

    return true;
};
