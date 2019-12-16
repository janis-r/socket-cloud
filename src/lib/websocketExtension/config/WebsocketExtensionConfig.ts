export type WebsocketExtensionConfig = {
    readonly name: string;
    readonly origin: string;
    readonly values: Record<string, string | number | undefined>;
};
