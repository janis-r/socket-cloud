import {ModuleConfig} from "qft";
import {LoggerModule} from "../logger";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";

export const ConfigurationContextModule: ModuleConfig = {
    requires: [
        LoggerModule
    ],
    mappings: [
        ConfigurationContextProvider
    ]
};
