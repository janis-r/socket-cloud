import {ModuleConfig} from "quiver-framework";
import {WebsocketConnectionValidationRequest} from "./event/WebsocketConnectionValidationRequest";
import {ValidateNewWebsocket} from "./command/ValidateNewWebsocket";
import {loggerModule} from "../logger/loggerModule";
import {ClientConnectionPoolModule} from "../clientConnectionPool/ClientConnectionPoolModule";
import {httpServerModule} from "../httpServer/httpServerModule";
import {HttpConnectionUpgradeEvent} from "../httpServer/event/HttpConnectionUpgradeEvent";
import {HandleConnectionUpgradeRequest} from "./command/HandleConnectionUpgradeRequest";
import {configurationContextModule} from "../configurationContext/configurationContextModule";

export const WebsocketListenerModule: ModuleConfig = {
    requires: [
        httpServerModule,
        configurationContextModule,
        ClientConnectionPoolModule,
        loggerModule
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
