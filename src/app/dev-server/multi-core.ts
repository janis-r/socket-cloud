import cluster from "cluster";
import {AppContext} from "quiver-framework";
import {devServerModule} from "./devServerModule";
import {deliveryProtocolModuleInMaster, deliveryProtocolModuleInWorker} from "../../lib/deliveryProtocol";

if (cluster.isMaster) {
    const {injector} = new AppContext()
        .configure(deliveryProtocolModuleInMaster)
        .initialize();
} else {
    const {injector} = new AppContext()
        .configure(devServerModule, deliveryProtocolModuleInWorker)
        .initialize();
}
