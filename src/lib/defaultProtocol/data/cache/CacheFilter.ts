import { MessageValidator } from "../../util/MessageValidator";

/**
 * Message cache filter options
 */
export type CacheFilter = {
    // Max age of returned messages in milliseconds
    maxAge?: number,
    // Max number of entries to return
    maxLength?: number,
    // Non inclusive oldest message id to be returned from cache
    messageId?: string
};
export const cacheFilterUtil = new MessageValidator<CacheFilter>([
    { field: "maxAge", type: "number", optional: true, validator: value => value > 0 },
    { field: "maxLength", type: "number", optional: true, validator: value => value > 0 },
    { field: "messageId", type: "string", optional: true, notEmpty: true },
]);
