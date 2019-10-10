import {Injectable} from "qft";
import * as fs from "fs";
import chalk from "chalk";
import {LogLevel} from "../data/LogLevel";
import {Logger} from "../service/Logger";
import {LoggerConfig} from "../data/LoggerConfig";
import {LoggerEntity} from "../data/LoggerEntity";
import {createLogFileName} from "../util/createLogFileName";
import {addLeadingZero} from "../../../util";
import ErrnoException = NodeJS.ErrnoException;
import {currentDateToObject} from "ugd10a";

/**
 * System wide logging service
 */
@Injectable()
export class LoggerImpl extends Logger {

    private readonly logDir: string;
    private readonly logToConsole: boolean;

    private readonly entities: { [name: string]: LoggerEntity } = {};

    constructor({logDir, logToConsole}: LoggerConfig) {
        super();

        this.logDir = logDir!;
        this.logToConsole = logToConsole || !logDir;

        // Create log file folder on startup, if it does not exist
        if (this.logDir && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
    }

    spawnEntity(name: LogLevel | string, logTime: boolean = true): LoggerEntity {
        if (!(name in this.entities)) {
            this.entities[name] = {
                name,
                log: (...message: any[]) => {
                    const formatter = getMessageFormatter(name);
                    if (name !== LogLevel.Console) { // Never write LogLevel.Console messages to file
                        this.writeMessage(message.join(' '), name, logTime);
                    }
                    if (name === LogLevel.Error || this.logToConsole) { // Always log to console LogLevel.Error messages
                        console.log(formatter(`[${name}] ${message}`));
                    }
                }
            }
        }
        return this.entities[name];
    }

    /**
     * Log message to app level log
     * @param message
     * @param {LogLevel} level
     */
    readonly log = (message: any, level: LogLevel | string = LogLevel.Log) => this.spawnEntity(level).log(message);

    /**
     * Log message to app level error log
     * @param message
     */
    readonly error = (...message: any[]) => this.spawnEntity(LogLevel.Error).log(message.join(' '));

    /**
     * Log message to app level debug log
     * @param message
     */
    readonly debug = (...message: any[]) => this.spawnEntity(LogLevel.Debug).log(message.join(' '));

    /**
     * Log message to app level notice log
     * @param message
     */
    readonly notice = (...message: any[]) => this.spawnEntity(LogLevel.Notice).log(message.join(' '));

    /**
     * Log message to debugging console if any is present and enabled
     * @param message
     */
    readonly console = (...message: any[]) => this.spawnEntity(LogLevel.Console).log(message.join(' '));


    private writeMessage(message: string, logFileName: string, logTime: boolean): void {
        if (!this.logDir) {
            return;
        }

        const filePath = this.getFilePath(logFileName);
        const formattedMessage = `${logTime ? getTimestamp() + ': ' : ''}${message}\n`;
        const errorHandler = (err: ErrnoException | null) => err && console.warn(`Could not write to debug log file - message: ${message}, logFileName: ${logFileName}`)
        fs.appendFile(filePath, formattedMessage, errorHandler);
    }

    private getFilePath(type: string): string {
        return this.logDir + createLogFileName(type);
    }
}


function getTimestamp(): string {
    const {date, month, year, hours, minutes, seconds} = currentDateToObject();
    const dateParts = [date, month, year].map(v => addLeadingZero(v));
    const timeParts = [hours, minutes, seconds].map(v => addLeadingZero(v));
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
