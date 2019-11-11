import {InjectionConfig, Module} from "qft";
import {Logger} from "./service/Logger";
import {LoggerImpl} from "./impl/LoggerImpl";
import {LoggerConfig} from "./data/LoggerConfig";

@Module({
    mappings: [
        {
            map: LoggerConfig,
            useValue: {
                logDir: __dirname + "/../../../log/", // TODO: This should be gone when active dev is over
                logToConsole: true
            }
        } as InjectionConfig<LoggerConfig>,
        {map: Logger, useType: LoggerImpl},
    ]
})
export class LoggerModule {
    constructor({error}: Logger) {
        // Subscribe for system errors, if we're in node.js environment
        if (!!process?.versions?.node) {
            process.on(
                "uncaughtException",
                ({message, stack}) => error(`uncaughtException: ${message}\n${stack}`)
            );
            process.on(
                "unhandledRejection",
                (reason) => error(`unhandledRejection: ${JSON.stringify(reason, null, ' ')}`)
            );
        }
    }
}
