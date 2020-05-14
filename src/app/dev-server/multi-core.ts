import cluster from "cluster";
import {AppContext} from "quiver-framework";
import {devServerModule} from "./devServerModule";
import {defaultProtocolModuleInMaster} from "../../lib/defaultProtocol/defaultProtocolModuleInMaster";
import {defaultProtocolModuleInWorker} from "../../lib/defaultProtocol/defaultProtocolModuleInWorker";
import {configurationContextModuleInMaster} from "../../lib/configurationContext/configurationContextModuleInMaster";
import {configurationContextModuleInWorker} from "../../lib/configurationContext/configurationContextModuleInWorker";
import {connectionApiModuleInWorker} from "../../lib/platformApi/connectionApi/connectionApiModuleInWorker";
import {connectionApiModuleInMaster} from "../../lib/platformApi/connectionApi/connectionApiModuleInMaster";

if (cluster.isMaster) {
    const {injector} = new AppContext()
        .configure(
            defaultProtocolModuleInMaster,
            configurationContextModuleInMaster,
            connectionApiModuleInMaster
        )
        .initialize();
} else {
    const {injector} = new AppContext()
        .configure(
            defaultProtocolModuleInWorker,
            configurationContextModuleInWorker,
            devServerModule,
            connectionApiModuleInWorker
        )
        .initialize();
}
