import {InjectionConfig, ModuleConfig} from "qft";
import {ExpressSession} from "./service/ExpressSession";
import {MemorySessionStore} from "./service/MemorySessionStore";
import {SessionConfig} from "./config/SessionConfig";
import {ExpressServerModule} from "./ExpressServerModule";

export const ExpressServerWithInMemorySession: ModuleConfig = {
    requires: [ExpressServerModule],
    mappings: [
        {map: ExpressSession, useType: MemorySessionStore},
        {
            map: SessionConfig,
            useValue: {
                sessionOptions: {
                    secret: 'secret-session-key'
                }
            }
        } as InjectionConfig<SessionConfig>
    ]
};
