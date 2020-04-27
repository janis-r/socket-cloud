import cluster from "cluster";
import {AppContext} from "quiver-framework";
import {devServerModule} from "./devServerModule";
import {defaultProtocolModuleInMaster, defaultProtocolModuleInWorker} from "../../lib/defaultProtocol";
import {configurationContextModuleInMaster} from "../../lib/configurationContext/configurationContextModuleInMaster";
import {configurationContextModuleInWorker} from "../../lib/configurationContext/configurationContextModuleInWorker";
import {configurationContextModule} from "../../lib/configurationContext/configurationContextModule";

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
            defaultProtocolModuleInWorker,
            configurationContextModuleInWorker,
            devServerModule,
        )
        .initialize();
}
