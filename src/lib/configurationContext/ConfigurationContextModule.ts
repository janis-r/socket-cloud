import {ModuleConfig} from "quiver-framework";
import {LoggerModule} from "../logger";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";
import {ValidateSocketConnectionEvent} from "../websocketListener";
import {ValidateNewConnection} from "./command/ValidateNewConnection";
import {DevServerContextProvider} from "./service/impl/DevServerContextProvider";

export const ConfigurationContextModule: ModuleConfig = {
    requires: [
        LoggerModule
    ],
    mappings: [
        {map: ConfigurationContextProvider, useType: DevServerContextProvider}
    ],
    commands: [
        {event: ValidateSocketConnectionEvent.TYPE, command: ValidateNewConnection}
    ]
};
