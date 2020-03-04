import {ModuleConfig} from "quiver-framework";
import {HttpServerConfig} from "./config/HttpServerConfig";
import {HttpServerRouter} from "./service/HttpServerRouter";
import {HttpServerService} from "./service/HttpServerService";

export const HttpServerModule: ModuleConfig = {
    mappings: [
        HttpServerConfig,
        {map: HttpServerService, instantiate: true},
        {map: HttpServerRouter, useExisting: HttpServerService}
    ]
};
