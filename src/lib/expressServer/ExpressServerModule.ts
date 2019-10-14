import {InjectionConfig, ModuleConfig} from "qft";
import {ExpressServer} from "./service/ExpressServer";
import {RequestContextFactory} from "./request/RequestContextFactory";
import {LoggerModule} from "../logger";
import {ServerConfig} from "./config/ServerConfig";
import {ExpressSession} from "./service/ExpressSession";
import {MemorySessionStore} from "./impl/MemorySessionStore";

export const ExpressServerModule: ModuleConfig = {
    mappings: [
        ExpressServer,
        {map: ExpressSession, useType: MemorySessionStore},
        {
            map: ServerConfig, useValue: {
                port: process.env.PORT || 3000
            }
        } as InjectionConfig<ServerConfig>,
        RequestContextFactory
    ],
    requires: [
        LoggerModule
    ]
};
