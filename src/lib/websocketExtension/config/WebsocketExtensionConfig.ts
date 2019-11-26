export type WebsocketExtensionConfig = {
    readonly origin: string;
    readonly values: Record<string, string | number | undefined>;
};
