const byExternalIdPrefix = "externalId/@";

export type ChannelId = string;

export const isChannelId = (value: unknown): value is ChannelId =>
    typeof value === "string" &&
    value.length > 0;

/**
 * Convert external id into channel id with encoded external id
 * @param externalId
 */
export const channelIdFromExternalId = (externalId: string) => byExternalIdPrefix + externalId;
/**
 * Extract external id from channel id, if present
 * @param channel
 */
export const externalIdFromChannelId = (channel: ChannelId) => {
    if (channel.substr(0, byExternalIdPrefix.length) !== byExternalIdPrefix || channel.length === byExternalIdPrefix.length) {
        return null;
    }
    return channel.substr(byExternalIdPrefix.length)
};
