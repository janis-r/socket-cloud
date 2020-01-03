import {ModuleConfig} from "qft";
import {HttpServerService} from "./service/HttpServerService";
import {HttpServerConfig} from "./config/HttpServerConfig";
import {HttpServerRouter} from "./service/HttpServerRouter";
import {HttpRequestEvent} from "./event/HttpRequestEvent";
import {RouteHttpRequest} from "./controller/RouteHttpRequest";

export const HttpServerModule: ModuleConfig = {
    mappings: [
        HttpServerConfig,
        {map: HttpServerService, instantiate: true},
        HttpServerRouter
    ],
    commands: [
        {event: HttpRequestEvent.TYPE, command: RouteHttpRequest}
    ]
};
