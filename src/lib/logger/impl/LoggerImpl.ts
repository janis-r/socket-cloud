import {Injectable} from "qft";
import {currentDateToObject} from "ugd10a";
import * as fs from "fs";
import chalk, {Chalk} from "chalk";
import {createLogFileName, Logger, LoggerConfig, LoggerEntity, LogLevel} from "..";

@Injectable()
export class LoggerImpl extends Logger {

    private readonly logDir: string;
    private readonly logToConsole: boolean;
    private readonly logFileMode: LoggerConfig["logFileMode"];
    private readonly entities = new Map<string, LoggerEntity>();

    constructor({logDir, logToConsole, logFileMode}: LoggerConfig) {
        super();

        this.logDir = logDir;
        this.logToConsole = logToConsole || !logDir;
        this.logFileMode = logFileMode;

        if (logDir && !fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
    }

    spawnEntity(level: LogLevel, logTime?: boolean, format?: Chalk): LoggerEntity;
    spawnEntity(name: string, logTime?: boolean, format?: Chalk): LoggerEntity;
    spawnEntity(name: LogLevel | string, logTime = true, format?: Chalk): LoggerEntity {
        const {entities, logToConsole} = this;
        if (!entities.has(name)) {
            entities.set(
                name,
                {
                    name,
                    log: (...message: any[]) => this.prepareMessage(message, name, logTime, format)
                }
            );
        }
        return entities.get(name);
    }

    readonly log = (message: any, level: LogLevel | string = LogLevel.Log) => this.spawnEntity(level).log(message);
    readonly error = (...message: any[]) => this.spawnEntity(LogLevel.Error).log(...message);
    readonly debug = (...message: any[]) => this.spawnEntity(LogLevel.Debug).log(...message);
    readonly notice = (...message: any[]) => this.spawnEntity(LogLevel.Notice).log(...message);
    /**
     * This is special log level that'll never be written to file and will be shown on console only when
     * logToConsole is enabled
     * @param message
     */
    readonly console = (...message: any[]) => this.spawnEntity(LogLevel.Console).log(...message);

    protected prepareMessage(message: any[], logLevel: string, logTime: boolean, format: Chalk): void {
        const {logToConsole} = this;

        const formatter = getMessageFormatter(logLevel);
        if (logLevel !== LogLevel.Console) {
            this.writeMessage(message, logLevel, logTime);
        }

        if (logLevel === LogLevel.Error || logToConsole) {
            console.log(`[${logLevel}]`, ...message);
        }
    }

    protected writeMessage(message: any[], logFileName: string, logTime: boolean): void {
        if (!this.logDir) {
            return;
        }
        const {getFilePath, logErrorHandler, logFileMode} = this;

        const unifiedMessage = message.map(entry => ["string", "number"].includes(typeof entry) ? entry : JSON.stringify(entry)).join(' ');
        const filePath = getFilePath(logFileMode === "one-file-per-level" ? logFileName : "log");
        const formattedMessage = `${logTime ? getTimestamp() + ': ' : ''}${unifiedMessage}\n`;

        fs.appendFile(filePath, formattedMessage, err => err && logErrorHandler(filePath, err));
    }

    private readonly getFilePath = (type: string) => this.logDir + createLogFileName(type);
    private readonly logErrorHandler = (file: string, {message = null}: { message: string }) => {
        message && console.warn(`Could not write to log file: ${{file, message}}`);
    };
}

function getTimestamp(): string {
    const {date, month, year, hours, minutes, seconds} = currentDateToObject();
    const dateParts = [date, month, year].map(v => v.toString().padStart(2, '0'));
    const timeParts = [hours, minutes, seconds].map(v => v.toString().padStart(2, '0'));
    return `${dateParts.join("/")}-${timeParts.join(":")}`;
}

function getMessageFormatter(name: string): (value: string) => string {
    if (name === LogLevel.Error) {
        return chalk.red;
    }
    if (name === LogLevel.Debug) {
        return chalk.cyan;
    }
    return value => value;
}
