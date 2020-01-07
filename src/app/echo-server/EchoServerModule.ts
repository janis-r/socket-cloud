import * as fs from "fs";
import {InjectionConfig, Module} from "qft";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {ConfigurationContextProvider} from "../../lib/configurationContext";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {ClientMessageEvent} from "../../lib/clientConnectionPool";
import {EchoMessageCommand} from "./EchoMessageCommand";
import {HttpServerConfig, HttpServerRouter} from "../../lib/httpServer";
import {IncomingMessage, ServerResponse} from "http";

@Module({
    requires: [
        WebsocketListenerModule,
        PermessageDeflateExtensionModule,
    ],
    mappings: [
        {
            map: HttpServerConfig,
            useValue: {port: 9001},
        } as InjectionConfig<HttpServerConfig>,
        {
            map: ConfigurationContextProvider,
            useValue: {
                getSocketConfigurationContext: (descriptor: SocketDescriptor) => ({
                    id: 'echo-server',
                    outgoingMessageFragmentSize: 2 ** 14
                })
            }
        },
        PermessageDeflateConfig
    ],
    commands: [
        {event: ClientMessageEvent.TYPE, command: EchoMessageCommand}
    ]
})
export class EchoServerModule {
    constructor(router: HttpServerRouter) {
        router.get('/', (request: IncomingMessage, response: ServerResponse) => {
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(fs.readFileSync(`${__dirname}/index.html`));
            response.end();
        });

        router.post('/validate-socket', async (request: IncomingMessage, response: ServerResponse) => {
            await new Promise<void>(resolve => {
                const chunks = new Array<Buffer>();
                request.on("data", chunk => chunks.push(chunk));
                request.on("end", () => {
                    console.log({body: JSON.parse(Buffer.concat(chunks).toString("utf8"))});
                    resolve();
                });
            });
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.write(JSON.stringify(true));
            response.end();
        });
    }
}
