import cluster from "cluster";
import {AppContext} from "qft";
import {devServerModule} from "./devServerModule";
import {deliveryProtocolModuleInWorker} from "../../lib/deliveryProtocol";
import {deliveryProtocolOnMasterModule} from "../../lib/deliveryProtocolOnMaster";

if (cluster.isMaster) {
    const {injector} = new AppContext()
        .configure(deliveryProtocolOnMasterModule)
        .initialize();
} else {
    const {injector} = new AppContext()
        .configure(
            devServerModule,
            deliveryProtocolModuleInWorker
        )
        .initialize();
}
