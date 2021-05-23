import { Validator } from "ugd10a/validator";

export abstract class ConfigurationContext {
    // Unique id of configuration context
    id: string;
    // Communication protocol name
    protocol: string;
    // Maximum number of simultaneous connections
    maxConnectionCount?: number;
    // Context operator API configuration
    operatorApi?: {
        // Url to operator API
        url: string;
        connection?: {
            // Whether to handshake emerging client connections with Operator before adding to connection pool
            doHandshake?: boolean;
            // Whether to perform informative call to Operator Api as new connection is established and added to connection pool
            reportNew?: boolean;
            // Whether to perform informative call to Operator Api as connection is dropped
            reportDropped?: boolean;
        }
    };
    // Number in milliseconds within which to send ping messages to client.
    // No messages will be sent is value is set to 0 or key is not present.
    pingTimeout?: number;
    // Fragmentation directive for outgoing messages. No message fragmentation will be applied
    // if this property is absent.
    outgoingMessageFragmentSize?: number;
    // Max payload size
    maxPayloadSize?: number;
    // Whether to compress data
    compressData?: boolean;
    // General instructions on how to cache outgoing messages applicable to all channels and individual messages unless
    // channel or individual message specific instructions are provided
    cachingPolicy?: {
        // Number of milliseconds for which to keep outgoing messages in cache
        cacheTime?: number;
        // Max number of messages to store in cache
        cacheSize?: number;
    };
    // Channel specific configurations that'll override values set in general configuration
    channelConfig?: {
        [channel: string]: {
            cachingPolicy?: ConfigurationContext["cachingPolicy"]
        }
    };
    // Individual message configuration. If omitted global configuration within cachingPolicy will be used.
    individualMessageConfig?: {
        cachingPolicy?: ConfigurationContext["cachingPolicy"]
    }
}

const cashingPolicyValidator = new Validator<ConfigurationContext["cachingPolicy"]>({
    cacheTime: { type: "number", optional: true },
    cacheSize: { type: "number", optional: true }
});

const perChannelConfigValidator = new Validator<ConfigurationContext["channelConfig"][0]>({
    cachingPolicy: {
        optional: true,
        validator: cashingPolicyValidator
    }
});

const individualMessageConfigValidator = new Validator<ConfigurationContext["individualMessageConfig"]>({
    cachingPolicy: {
        optional: true,
        validator: cashingPolicyValidator
    }
});

export const configurationContextValidator = new Validator<ConfigurationContext>({
    id: { type: "string", notEmpty: true, validator: ({ length }: string) => length >= 2 && length <= 50 },
    protocol: { type: "string", notEmpty: true },
    maxConnectionCount: { type: "number", optional: true },
    operatorApi: {
        validator: new Validator<ConfigurationContext["operatorApi"]>({
            url: { type: "string" },
            connection: {
                type: "object",
                optional: true,
                validator: new Validator<ConfigurationContext["operatorApi"]["connection"]>({
                    doHandshake: { type: "boolean", optional: true },
                    reportNew: { type: "boolean", optional: true },
                    reportDropped: { type: "boolean", optional: true }
                })
            }
        }).validate,
        optional: true
    },
    pingTimeout: { type: "number", optional: true },
    outgoingMessageFragmentSize: { type: "number", optional: true },
    maxPayloadSize: { type: "number", optional: true },
    compressData: { type: "boolean", optional: true },
    cachingPolicy: {
        optional: true,
        validator: cashingPolicyValidator
    },
    channelConfig: {
        optional: true,
        validator: value => {
            const error = Object.keys(value).find(channelId => perChannelConfigValidator.validate(value[channelId]) !== true);
            if (error) {
                return `Invalid per channel caching policy entry encountered - ${JSON.stringify(error)}, error - ${JSON.stringify(perChannelConfigValidator.lastError)}`;
            }
            return true;
        }
    },
    individualMessageConfig: {
        optional: true,
        validator: individualMessageConfigValidator
    }
});
