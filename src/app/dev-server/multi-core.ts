import cluster from "cluster";
import {AppContext} from "quiver-framework";
import {devServerModule} from "./devServerModule";
import {defaultProtocolModuleInMaster, defaultProtocolModuleInWorker} from "../../lib/defaultProtocol";

if (cluster.isMaster) {
    const {injector} = new AppContext()
        .configure(defaultProtocolModuleInMaster)
        .initialize();
} else {
    const {injector} = new AppContext()
        .configure(devServerModule, defaultProtocolModuleInWorker)
        .initialize();
}
