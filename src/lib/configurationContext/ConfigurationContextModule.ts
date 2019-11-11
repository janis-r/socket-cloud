import {ModuleConfig} from "qft";
import {LoggerModule} from "../logger";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";
import {ValidateSocketConnectionEvent} from "../socketListener";
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
