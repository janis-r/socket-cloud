import {AppContext, Injectable, InjectionConfig} from "qft";
import {Logger, LoggerModule} from "../../lib/logger";
import {EchoServerModule} from "./EchoServerModule";
import cluster from "cluster";
import {LoggerImpl} from "../../lib/logger/impl/LoggerImpl";
import {Chalk} from "chalk";

@Injectable()
class CustomLogger extends LoggerImpl {
    protected prepareMessage(message: any[], logFileName: string, logTime: boolean, format: Chalk): void {
        super.prepareMessage([`(#${cluster.worker.id})`, ...message], logFileName, logTime, format);
    }
}

if (cluster.isMaster) {
    const numCPUs = require('os').cpus().length;

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        worker.on('message', (msg: any) => {
            console.log('>> msg', msg);

        });
    }
} else {
    const {injector} = new AppContext()
        .configure(
            LoggerModule,
            {
                mappings: [
                    {
                        map: Logger,
                        useType: CustomLogger
                    } as InjectionConfig<Logger>
                ]
            },
            EchoServerModule
        )
        .initialize();

    injector.get(Logger).console(`Multi core echo server context initialized`, cluster.worker.id);
}
