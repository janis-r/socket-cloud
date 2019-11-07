export type ConfigurationContext = Readonly<{
    id: string;
    maxConnectionCount?: number;
    connectionValidationUrl?: string;
}>;
