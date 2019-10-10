import {InjectionConfig, ModuleConfig} from "qft";
import {ExpressServer} from "./service/ExpressServer";
import {RequestContextFactory} from "./request/RequestContextFactory";
import {LoggerModule} from "../logger";
import {ExpressServerConfig} from "./config/ExpressServerConfig";
import {ExpressSession} from "./service/ExpressSession";
import {DebugSession} from "./impl/DebugSession";
import {toMilliseconds} from "ugd10a";

export const ExpressServerModule: ModuleConfig = {
    mappings: [
        ExpressServer,
        {map: ExpressSession, useType: DebugSession},
        {
            map: ExpressServerConfig, useValue: {
                port: 4000,
                sessionOptions: {
                    secret: "session-secret",
                    resave: false,
                    saveUninitialized: false,
                    cookie: {
                        maxAge: toMilliseconds(24 * 30, "hours")
                    }
                },
                sessionStoreHosts: ["127.0.0.1:11211"]
            }
        } as InjectionConfig<ExpressServerConfig>,
        RequestContextFactory
    ],
    requires: [
        LoggerModule
    ]
};
