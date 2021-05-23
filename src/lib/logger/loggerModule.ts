import { InjectionConfig, ModuleConfig } from "quiver-framework";
import { Logger } from "./service/Logger";
import { LoggerImpl } from "./impl/LoggerImpl";
import { LoggerConfig } from "./data/LoggerConfig";

export const loggerModule: ModuleConfig = {
    mappings: [
        {
            map: LoggerConfig,
            useValue: {
                logDir: __dirname + "/../../../log/", // TODO: This should be gone when active dev is over
                logToConsole: false,
                logFileMode: "one-file-per-level"
            }
        } as InjectionConfig<LoggerConfig>,
        { map: Logger, useType: LoggerImpl },
    ],
    setup: injector => {
        const { error } = injector.get(Logger);
        // Subscribe for system errors, if we're in node.js environment
        if (!!process?.versions?.node) {
            process.on(
                "uncaughtException",
                ({ message, stack }) => {
                    error(`uncaughtException: message: ${message}\nstack: ${stack}`);
                    console.log(">> exit");
                    process.exit();
                }
            );
            /*process.on(
                "unhandledRejection",
                (reason, p) => {
                    // TODO: Here's a room for improvement
                    error(`unhandledRejection: ${JSON.stringify({reason}, null, ' ')}`)
                    /!*if (p) {
                        p.then(res => 'then: ' + JSON.stringify(res))
                        p.catch(res => 'catch: ' + JSON.stringify(res))
                    }*!/
                }
            );*/
        }
    }
};
