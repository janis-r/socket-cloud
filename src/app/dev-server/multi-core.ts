import cluster from "cluster";
import {AppContext, EventDispatcher} from "quiver-framework";
import {devServerModule} from "./devServerModule";
import {defaultProtocolModuleInMaster, defaultProtocolModuleInWorker} from "../../lib/defaultProtocol";
import {configurationContextModuleInMaster} from "../../lib/configurationContext/configurationContextModuleInMaster";
import {configurationContextModuleInWorker} from "../../lib/configurationContext/configurationContextModuleInWorker";
import {UpdateConfigurationContextEvent} from "../../lib/configurationContext/event/UpdateConfigurationContextEvent";

if (cluster.isMaster) {
    const {injector} = new AppContext()
        .configure(
            defaultProtocolModuleInMaster,
            configurationContextModuleInMaster
        )
        .initialize();
} else {
    const {injector} = new AppContext()
        .configure(
            devServerModule,
            defaultProtocolModuleInWorker,
            configurationContextModuleInWorker
        )
        .initialize();
}
