import {ModuleConfig} from "quiver-framework";

import {PlatformApiHub} from "./service/PlatformApiHub";
import {PlatformApiCallManager} from "./service/PlatformApiCallManager";
import {PlatformApiCallManagerSqLite} from "./service/impl/PlatformApiCallManagerSqLite";
import {clientConnectionPoolModule} from "../../clientConnectionPool/clientConnectionPoolModule";
import {configurationContextModule} from "../../configurationContext/configurationContextModule";
import {httpServerModule} from "../../httpServer/httpServerModule";
import {authorizationModule} from "../../authorization/authorizationModule";

/**
 * Base module of any of platform API modules providing necessary environment for Api implementations
 * and no actual Api functionality.
 */
export const apiHubModule: ModuleConfig = {
    requires: [
        configurationContextModule,
        httpServerModule,
        authorizationModule
    ],
    mappings: [
        {map: PlatformApiCallManager, useType: PlatformApiCallManagerSqLite},
        PlatformApiHub
    ]
}
