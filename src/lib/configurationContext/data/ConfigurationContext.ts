import {Validator} from "../../utils/validator";

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
            cachingPolicy?: ConfigurationContext['cachingPolicy']
        }
    };
}

export const configurationContextValidator = new Validator<ConfigurationContext>([
    {field: "id", type: "string", validator: ({length}: string) => length >= 2 && length <= 50},
    {field: "protocol", type: "string", notEmpty: true},
    {field: "maxConnectionCount", type: "number", optional: true},
    {field: "validationApi", type: "object", optional: true}, // TODO: Add object content validation
    {field: "pingTimeout", type: "number", optional: true},
    {field: "outgoingMessageFragmentSize", type: "number", optional: true},
    {field: "maxPayloadSize", type: "number", optional: true},
    {field: "compressData", type: "boolean", optional: true},
    {field: "cachingPolicy", type: "object", optional: true},
    {field: "channelConfig", type: "object", optional: true},
]);
