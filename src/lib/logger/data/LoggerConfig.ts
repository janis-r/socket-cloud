export abstract class LoggerConfig {
    readonly logDir: string;
    readonly logToConsole: boolean;
    readonly logFileMode: "single-file" | "one-file-per-level";
}
