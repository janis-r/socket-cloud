import {ModuleConfig} from "quiver-framework";
import {AccessTokenProvider} from "./service/AccessTokenProvider";
import {AccessTokenDataModel} from "./model/AccessTokenDataModel";
import {AccessTokenDataModelSqLite} from "./model/impl/AccessTokenDataModelSqLite";
import {AccessTokenApiListener} from "./service/AccessTokenApiListener";

export const authorizationModule: ModuleConfig = {
    requires: [
        // configurationContextModule TODO: Looks like authorizationModule and configurationContextModule should be merged
    ],
    mappings: [
        AccessTokenProvider,
        {map: AccessTokenDataModel, useType: AccessTokenDataModelSqLite},
        {map: AccessTokenApiListener, instantiate: true}
    ]
};


