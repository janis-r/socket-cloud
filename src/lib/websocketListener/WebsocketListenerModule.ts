import {ModuleConfig} from "quiver-framework";
import {WebsocketConnectionValidationRequest} from "./event/WebsocketConnectionValidationRequest";
import {ValidateNewWebsocket} from "./command/ValidateNewWebsocket";
import {loggerModule} from "../logger/loggerModule";
import {clientConnectionPoolModule} from "../clientConnectionPool/clientConnectionPoolModule";
import {httpServerModule} from "../httpServer/httpServerModule";
import {HttpConnectionUpgradeEvent} from "../httpServer/event/HttpConnectionUpgradeEvent";
import {HandleConnectionUpgradeRequest} from "./command/HandleConnectionUpgradeRequest";
import {configurationContextModule} from "../configurationContext/configurationContextModule";

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
