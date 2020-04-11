import {InjectionConfig, ModuleConfig} from "quiver-framework";
import {AccessTokenProvider} from "./service/AccessTokenProvider";
import {AccessTokenApiConfig} from "./config/AccessTokenApiConfig";
import {AccessTokenDataModel} from "./model/AccessTokenDataModel";
import {AccessTokenDataModelSqLite} from "./model/impl/AccessTokenDataModelSqLite";
import {AccessTokenApiListener} from "./service/AccessTokenApiListener";

export const authorizationModule: ModuleConfig = {
    requires: [
        // configurationContextModule TODO: ....
    ],
    mappings: [
        AccessTokenProvider,
        {map: AccessTokenDataModel, useType: AccessTokenDataModelSqLite},
        {
            map: AccessTokenApiConfig,
            useValue: {apiKey: process?.env?.ACCESS_TOKEN_MANAGER_KEY || "DEV::ACCESS_TOKEN_MANAGER_KEY"}
        } as InjectionConfig<AccessTokenApiConfig>,
        {map: AccessTokenApiListener, instantiate: true}
    ]
};


