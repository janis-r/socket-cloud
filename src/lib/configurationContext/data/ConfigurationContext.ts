import {Validator} from "ugd10a/validator";

export abstract class ConfigurationContext {
    // Unique id of configuration context
    id: string;
    // Communication protocol name
    protocol: string;
    // Maximum number of simultaneous connections
    maxConnectionCount?: number;
    // Validation API configuration
    validationApi?: {
        // Url to external validation API
        url: string;
        // Whether to invoke external API to validate emerging client connections
        validateNewConnections?: boolean;
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
    // General instructions on how to cache outgoing messages applicable to all channels unless channel
    // specific instructions are provided
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
}

const cashingPolicyValidator = new Validator<ConfigurationContext["cachingPolicy"]>({
    cacheTime: {type: "number", optional: true},
    cacheSize: {type: "number", optional: true}
});

export const configurationContextValidator = new Validator<ConfigurationContext>({
    id: {type: "string", notEmpty: true, validator: ({length}: string) => length >= 2 && length <= 50},
    protocol: {type: "string", notEmpty: true},
    maxConnectionCount: {type: "number", optional: true},
    validationApi: {
        validator: new Validator<ConfigurationContext["validationApi"]>({
            url: {type: "string"},
            validateNewConnections: {type: "boolean", optional: true}
        }).validate,
        optional: true
    },
    pingTimeout: {type: "number", optional: true},
    outgoingMessageFragmentSize: {type: "number", optional: true},
    maxPayloadSize: {type: "number", optional: true},
    compressData: {type: "boolean", optional: true},
    cachingPolicy: {
        validator: cashingPolicyValidator.validate,
        optional: true
    },
    channelConfig: {
        type: "object",
        optional: true,
        validator: value => !Object.keys(value).some(entry => !cashingPolicyValidator.validate(entry))
    },
});
