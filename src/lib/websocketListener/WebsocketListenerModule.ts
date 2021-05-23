import { ModuleConfig } from "quiver-framework";
import { clientConnectionPoolModule } from "../clientConnectionPool/clientConnectionPoolModule";
import { configurationContextModule } from "../configurationContext/configurationContextModule";
import { HttpConnectionUpgradeEvent } from "../httpServer/event/HttpConnectionUpgradeEvent";
import { httpServerModule } from "../httpServer/httpServerModule";
import { loggerModule } from "../logger/loggerModule";
import { HandleConnectionUpgradeRequest } from "./command/HandleConnectionUpgradeRequest";
import { ValidateNewWebsocket } from "./command/ValidateNewWebsocket";
import { WebsocketConnectionValidationRequest } from "./event/WebsocketConnectionValidationRequest";

export const websocketListenerModule: ModuleConfig = {
    requires: [
        httpServerModule,
        configurationContextModule,
        clientConnectionPoolModule,
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
