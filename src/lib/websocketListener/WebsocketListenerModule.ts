import {ModuleConfig} from "qft";
import {WebsocketConnectionValidationRequest} from "./event/WebsocketConnectionValidationRequest";
import {ValidateNewWebsocket} from "./command/ValidateNewWebsocket";
import {LoggerModule} from "../logger";
import {ConfigurationContextModule} from "../configurationContext";
import {ClientConnectionPoolModule} from "../clientConnectionPool";
import {HttpConnectionUpgradeEvent, HttpServerModule} from "../httpServer";
import {HandleConnectionUpgradeRequest} from "./command/HandleConnectionUpgradeRequest";

export const WebsocketListenerModule: ModuleConfig = {
    requires: [
        HttpServerModule,
        ConfigurationContextModule,
        ClientConnectionPoolModule,
        LoggerModule
    ],
    commands: [
        {
            event: HttpConnectionUpgradeEvent.TYPE,
            command: HandleConnectionUpgradeRequest
        },
        {
            event: WebsocketConnectionValidationRequest.TYPE,
            command: ValidateNewWebsocket
        }
    ]
};
