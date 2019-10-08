import {InjectionConfig, Module} from "qft";
import {Logger} from "./service/Logger";
import {LoggerImpl} from "./impl/LoggerImpl";
import {LoggerConfig} from "./data/LoggerConfig";

@Module({
    mappings: [
        {
            map: LoggerConfig,
            useValue: {
                logDir: __dirname + "/../log/",
                logToConsole: true
            }
        } as InjectionConfig<LoggerConfig>,
        {map: Logger, useType: LoggerImpl},
    ]
})
export class LoggerModule {

    constructor({error}: Logger) {
        process.on("uncaughtException", ({message, stack}) => error(`uncaughtException: ${message}\n${stack}`));
        process.on("unhandledRejection", (reason, promise) => error(`unhandledRejection: ${{reason, promise}}`));
    }
}
