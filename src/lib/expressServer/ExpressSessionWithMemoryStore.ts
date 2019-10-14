import {InjectionConfig, Module} from "qft";
import {ExpressSession} from "./service/ExpressSession";
import {MemorySessionStore} from "./impl/MemorySessionStore";
import {SessionConfig} from "./config/SessionConfig";

@Module({
    mappings: [
        {map: ExpressSession, useType: MemorySessionStore},
        {
            map: SessionConfig, useValue: {
                sessionOptions: {
                    secret: 'secret-session-key'
                }
            }
        } as InjectionConfig<SessionConfig>
    ]
})

export class ExpressSessionWithMemoryStore {

}
