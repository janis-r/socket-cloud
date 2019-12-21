import {ModuleConfig} from "qft";
import {WebSocketListenerConfig} from "./config/WebSocketListenerConfig";
import {WebsocketListener} from "./service/WebsocketListener";
import {WebsocketConnectionValidationRequest} from "./event/WebsocketConnectionValidationRequest";
import {ValidateNewWebsocket} from "./command/ValidateNewWebsocket";
import {LoggerModule} from "../logger";
import {ConfigurationContextModule} from "../configurationContext";
import {ClientConnectionModule} from "../clientConnectionPool";

export const WebsocketListenerModule: ModuleConfig = {
    requires: [
        LoggerModule,
        ConfigurationContextModule,
        ClientConnectionModule
    ],
    mappings: [
        WebSocketListenerConfig,
        {map: WebsocketListener, asSingleton: true, instantiate: true}
    ],
    commands: [
        {event: WebsocketConnectionValidationRequest.TYPE, command: ValidateNewWebsocket}
    ]
};
