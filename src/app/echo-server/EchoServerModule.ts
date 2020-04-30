import {InjectionConfig, Injector, Module} from "quiver-framework";
import {WebsocketListenerModule} from "../../lib/websocketListener/WebsocketListenerModule";
import {ConfigurationContextProvider} from "../../lib/configurationContext/service/ConfigurationContextProvider";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {PermessageDeflateConfig} from "../../lib/permessageDeflateExtension/config/PermessageDeflateConfig";
import {PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension/PermessageDeflateExtensionModule";
import {ClientMessageEvent} from "../../lib/clientConnectionPool/event/ClientMessageEvent";
import {EchoMessageCommand} from "./EchoMessageCommand";
import {HttpServerConfig} from "../../lib/httpServer/config/HttpServerConfig";
import {HttpServerRouter} from "../../lib/httpServer/service/HttpServerRouter";

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
                    outgoingMessageFragmentSize: 2 ** 14,
                    compressData: true
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
        router.get('/', ({sendFile}) => sendFile(`${__dirname}/index.html`));
        router.post('/validate-socket', ({body, sendJson}) => {
            console.log({body});
            sendJson(true);
        });
    }
}
