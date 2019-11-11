import {ModuleConfig} from "qft";
import {WebSocketListenerConfig} from "./config/WebSocketListenerConfig";
import {WebSocketListener} from "./service/WebSocketListener";
import {LoggerModule} from "../logger";
import {ConfigurationContextModule} from "../configurationContext";

export const SocketListenerBaseModule: ModuleConfig = {
    requires: [
        LoggerModule,
        ConfigurationContextModule
    ],
    mappings: [
        WebSocketListenerConfig,
        {map: WebSocketListener, instantiate: true}
    ]
};
