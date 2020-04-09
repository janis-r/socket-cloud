import {ModuleConfig} from "quiver-framework";
import {AccessTokenManager} from "./service/AccessTokenManager";
import {DevAccessTokenManager} from "./service/impl/DevAccessTokenManager";


export const authorizationModule: ModuleConfig = {
    mappings: [
        {map: AccessTokenManager, useType: DevAccessTokenManager}
    ]
};


