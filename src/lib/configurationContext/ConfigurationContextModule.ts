import {ModuleConfig} from "quiver-framework";
import {LoggerModule} from "../logger";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";
import {ValidateSocketConnectionEvent} from "../websocketListener";
import {ValidateNewConnection} from "./command/ValidateNewConnection";

export const ConfigurationContextModule: ModuleConfig = {
    requires: [
        LoggerModule
    ],
    mappings: [
        ConfigurationContextProvider
    ],
    commands: [
        {event: ValidateSocketConnectionEvent.TYPE, command: ValidateNewConnection}
    ]
};
