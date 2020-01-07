import {MessageCachingPolicy} from "./MessageCachingPolicy";

export abstract class ConfigurationContext {
    // Unique id of configuration context
    id: string;
    // Communication protocol name
    protocol: string;
    // Maximum number of simultaneous connections
    maxConnectionCount?: number;
    // End-point address to send new connection data in order to validate new connection
    connectionValidationUrl?: string;
    // Number in milliseconds within which to send ping messages to client.
    // No messages will be sent is value is set to 0 or key is not present.
    pingTimeout?: number;
    // Fragmentation directive for outgoing messages. No message fragmentation will be applied
    // if this property is absent.
    outgoingMessageFragmentSize?: number;
    // Instructions on how to cache outgoing messages.
    // No caching will be applied and no messages will be available for recovery, in case if this entry is missing.
    messageCaching?:MessageCachingPolicy & {
        // Channel specific configurations that'll override values set in general configuration
        perChannelCachingConfig?: Record<string, MessageCachingPolicy>;
    }
}
