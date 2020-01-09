import {InjectionConfig, Injector, Module} from "qft";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {ConfigurationContextProvider} from "../../lib/configurationContext";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {ClientMessageEvent} from "../../lib/clientConnectionPool";
import {EchoMessageCommand} from "./EchoMessageCommand";
import {HttpServerConfig, HttpServerRouter} from "../../lib/httpServer";

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
    constructor(router: HttpServerRouter, i: Injector) {

        // console.log(i)
        // console.log(router)
        // process.exit()

        router.get('/', (request, response) => {
            response.sendFile(`${__dirname}/index.html`);
        });

        router.post('/validate-socket', async (request, response) => {
            console.log({body: request.body});
            response.json(true);
        });
    }
}
