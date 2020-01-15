import {LogLevel} from "../data/LogLevel";
import {LoggerEntity} from "../data/LoggerEntity";

/**
 * System wide logging service
 */
export abstract class Logger {
    /**
     * Spawn entity of a logger with custom name, or retrieve an existing instance of pre fabricated instance
     * @param {LogLevel | string} name Name of a logger or log level as name
     * @param {Boolean} logTime Define if timestamp should be placed in start of every line
     */
    abstract spawnEntity(name: LogLevel | string, logTime?: boolean): LoggerEntity;

    /**
     * Log message to app level log
     * @param message
     * @param {LogLevel | string} level
     */
    abstract log: (message: any, level?: LogLevel | string) => void;

    /**
     * Log message to app level error log
     * @param message
     */
    abstract error: (...message: any[]) => void;

    /**
     * Log message to app level debug log
     * @param message
     */
    abstract debug: (...message: any[]) => void;

    /**
     * Show notice message on screen
     * @param {string} message
     */
    abstract notice: (...message: any[]) => void;

    /**
     * Log message to console. This is logging that is useful within development time and has no value on
     * later product lifecycle stages.
     */
    abstract console: (...message: any[]) => void;

    /**
     * Logging context name to identify general scope of logged content
     */
    abstract context?: string;
}
