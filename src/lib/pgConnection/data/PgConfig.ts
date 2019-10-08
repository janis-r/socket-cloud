export abstract class PgConfig {
    readonly host: string;
    readonly database: string;
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly slowQueryThreshold: number;
}
