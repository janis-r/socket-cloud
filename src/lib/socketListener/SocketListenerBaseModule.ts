import {ModuleConfig} from "qft";
import {LoggerModule} from "../logger";
import {ConfigurationContextModule} from "../configurationContext";

export const SocketListenerBaseModule: ModuleConfig = {
    requires: [
        LoggerModule,
        ConfigurationContextModule
    ]
};
