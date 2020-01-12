export type CachingPolicy = {
    // Number of milliseconds for which to keep outgoing messages in cache
    cacheTimeMs?: number;
    // Max number of messages to store in cache
    maxCacheSize?: number;
}
