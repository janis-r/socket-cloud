const byExternalIdPrefix = "externalId/@";

export type ChannelId = string;

export const isChannelId = (value: unknown): value is ChannelId =>
    typeof value === "string" &&
    value.length > 0;

export const channelIdByExternalId = (externalId: string) => byExternalIdPrefix + externalId;

export const getExternalIdFromChannelId = (channel: ChannelId) => {
    if (channel.substr(0, byExternalIdPrefix.length) !== byExternalIdPrefix || channel.length === byExternalIdPrefix.length) {
        return null;
    }
    return channel.substr(byExternalIdPrefix.length)
};
