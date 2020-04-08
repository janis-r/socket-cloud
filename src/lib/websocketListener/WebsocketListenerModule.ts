import {ModuleConfig} from "quiver-framework";
import {WebsocketConnectionValidationRequest} from "./event/WebsocketConnectionValidationRequest";
import {ValidateNewWebsocket} from "./command/ValidateNewWebsocket";
import {LoggerModule} from "../logger";
import {configurationContextModule} from "../configurationContext/configurationContextModule";
import {ClientConnectionPoolModule} from "../clientConnectionPool";
import {HttpConnectionUpgradeEvent, HttpServerModule} from "../httpServer";
import {HandleConnectionUpgradeRequest} from "./command/HandleConnectionUpgradeRequest";

export const WebsocketListenerModule: ModuleConfig = {
    requires: [
        HttpServerModule,
        // ConfigurationContextModule, //TODO: ConfigurationContextModule is required here! but for some reason i'm running into unresolvable module reference so it's moved to top level.
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
