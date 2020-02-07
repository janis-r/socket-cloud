import {Context, WebApplicationBundle} from "qft";
import cluster from "cluster";
import {devServerModule} from "./devServerModule";
import {deliveryProtocolModuleInWorker} from "../../lib/deliveryProtocol";
import {deliveryProtocolOnMasterModule} from "../../lib/deliveryProtocolOnMaster";

if (cluster.isMaster) {
    const {injector} = new Context()
        .install(...WebApplicationBundle)
        .configure(deliveryProtocolOnMasterModule)
        .initialize();
    console.log(`Multi core dev server master initialized`);
} else {
    const {injector} = new Context()
        .install(...WebApplicationBundle)
        .configure(
            devServerModule,
            deliveryProtocolModuleInWorker
        )
        .initialize();
    console.log(`   Worker context initialized`, cluster.worker.id);
}
