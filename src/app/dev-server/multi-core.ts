import {Context, WebApplicationBundle} from "qft";
import {Logger} from "../../lib/logger";
import cluster from "cluster";
import {DevServerModule} from "./devServerModule";

if (cluster.isMaster) {
    const numCPUs = require('os').cpus().length;

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        worker.on('message', (msg: any) => {
            console.log('>> msg', msg);

        });
    }

} else {
    const {injector} = new Context()
        .install(...WebApplicationBundle)
        .configure(DevServerModule)
        .initialize();

    injector.get(Logger).console(`Multi core dev server context initialized`, cluster.worker.id);
}
