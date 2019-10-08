import {Module} from "quiver-framework";
import {ExpressServer} from "./service/ExpressServer";
import {RequestContextFactory} from "./request/RequestContextFactory";
import {LoggerModule} from "../logger";
import {ExpressServerConfig} from "./config/ExpressServerConfig";
import {NodeEnvConfig} from "./impl/NodeEnvConfig";
import {ExpressSession} from "./service/ExpressSession";
import {MemcachedSession} from "./impl/MemcachedSession";

@Module({
    mappings: [
        ExpressServer,
        {map: ExpressSession, useType: MemcachedSession, asSingleton: true},
        RequestContextFactory,
        {map: ExpressServerConfig, useType: NodeEnvConfig}
    ],
    requires: [
        LoggerModule
    ]
})
/**
 * Application module which defines system level utilities and data flows
 */
export class ExpressServerModule {

}