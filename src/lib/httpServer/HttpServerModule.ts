import {ModuleConfig} from "qft";
import {HttpServerService} from "./service/HttpServerService";
import {HttpServerConfig} from "./config/HttpServerConfig";

export const HttpServerModule: ModuleConfig = {
    mappings: [
        HttpServerConfig,
        {map: HttpServerService, instantiate: true, asSingleton: true}
    ]
};
