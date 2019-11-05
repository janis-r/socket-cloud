import {ContextLifecycleEvent, InjectionConfig, ModuleConfig} from "qft";
import {ExpressServer} from "./service/ExpressServer";
import {RequestContextFactory} from "./request/RequestContextFactory";
import {LoggerModule} from "../logger";
import {ServerConfig} from "./config/ServerConfig";
import {SetServerVersion} from "./command/SetServerVersion";

export const ExpressServerModule: ModuleConfig = {
    requires: [
        LoggerModule
    ],
    mappings: [
        ExpressServer,
        RequestContextFactory,
        {
            map: ServerConfig,
            useValue: {
                port: process.env.HTTP_PORT || 3000
            }
        } as InjectionConfig<ServerConfig>
    ],
    commands: [
        {event: ContextLifecycleEvent.POST_INITIALIZE, command: SetServerVersion, once: true}
    ]
};
