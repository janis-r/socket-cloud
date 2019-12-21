import {Injectable} from "qft";
import {currentDateToObject} from "ugd10a";
import * as fs from "fs";
import chalk, {Chalk} from "chalk";
import {LogLevel} from "../data/LogLevel";
import {Logger} from "../service/Logger";
import {LoggerConfig} from "../data/LoggerConfig";
import {LoggerEntity} from "../data/LoggerEntity";
import {createLogFileName} from "../util/createLogFileName";

@Injectable()
export class LoggerImpl extends Logger {

    private readonly logDir: string;
    private readonly logToConsole: boolean;
    private readonly logFileMode: LoggerConfig["logFileMode"];
    private readonly entities: Record<string, LoggerEntity> = {};

    constructor({logDir, logToConsole, logFileMode}: LoggerConfig) {
        super();

        this.logDir = logDir!;
        this.logToConsole = logToConsole || !logDir;
        this.logFileMode = logFileMode;

        if (this.logDir && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
    }

    spawnEntity(level: LogLevel, logTime?: boolean, format?: Chalk): LoggerEntity;
    spawnEntity(name: string, logTime?: boolean, format?: Chalk): LoggerEntity;
    spawnEntity(nameOrLevel: LogLevel | string, logTime: boolean = true, format?: Chalk): LoggerEntity {
        const {entities, logToConsole} = this;
        if (!(nameOrLevel in entities)) {
            entities[nameOrLevel] = {
                name: nameOrLevel,
                log: (...message: any[]) => {
                    const formatter = getMessageFormatter(nameOrLevel);
                    if (nameOrLevel !== LogLevel.Console) { // Never write LogLevel.Console messages to file
                        this.writeMessage(message.join(' '), nameOrLevel, logTime);
                    }
                    if (nameOrLevel === LogLevel.Error || logToConsole) { // Always log to console LogLevel.Error messages
                        console.log(formatter(`[${nameOrLevel}] ${format ? format(...message) : message}`));
                    }
                }
            }
        }
        return entities[nameOrLevel];
    }

    readonly log = (message: any, level: LogLevel | string = LogLevel.Log) => this.spawnEntity(level).log(message);
    readonly error = (...message: any[]) => this.spawnEntity(LogLevel.Error).log(message.join(' '));
    readonly debug = (...message: any[]) => this.spawnEntity(LogLevel.Debug).log(message.join(' '));
    readonly notice = (...message: any[]) => this.spawnEntity(LogLevel.Notice).log(message.join(' '));
    readonly console = (...message: any[]) => this.spawnEntity(LogLevel.Console).log(message.join(' '));

    private writeMessage(message: string, logFileName: string, logTime: boolean): void {
        if (!this.logDir) {
            return;
        }
        const {getFilePath, logErrorHandler, logFileMode} = this;

        const filePath = getFilePath(logFileMode === "one-file-per-level" ? logFileName : "log");
        const formattedMessage = `${logTime ? getTimestamp() + ': ' : ''}${message}\n`;

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
