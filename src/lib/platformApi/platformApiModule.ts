import {ModuleConfig} from "quiver-framework";
import {clientConnectionPoolModule} from "../clientConnectionPool/clientConnectionPoolModule";
import {configurationContextModule} from "../configurationContext/configurationContextModule";
import {httpServerModule} from "../httpServer/httpServerModule";
import {authorizationModule} from "../authorization/authorizationModule";
import {PlatformApiHub} from "./service/PlatformApiHub";
import {PlatformApiCallManager} from "./service/PlatformApiCallManager";
import {PlatformApiCallManagerSqLite} from "./service/impl/PlatformApiCallManagerSqLite";
import {PublishingApiListener} from "./service/api/PublishingApiListener";

export const platformApiModule: ModuleConfig = {
    requires: [
        clientConnectionPoolModule,
        configurationContextModule,
        httpServerModule,
        authorizationModule
    ],
    mappings: [
        {map: PlatformApiCallManager, useType: PlatformApiCallManagerSqLite},
        PlatformApiHub,
        {map: PublishingApiListener, instantiate: true},
    ]
}
