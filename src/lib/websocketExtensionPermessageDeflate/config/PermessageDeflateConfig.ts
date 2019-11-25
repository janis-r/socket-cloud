export abstract class PermessageDeflateConfig {
    readonly serverNoContextTakeover?: boolean;
    readonly clientNoContextTakeover?: boolean;
    readonly serverMaxWindowBits?: number;
    readonly clientMaxWindowBits?: number;
}
