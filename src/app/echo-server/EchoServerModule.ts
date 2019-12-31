import {InjectionConfig, ModuleConfig} from "qft";
import {WebsocketListenerModule} from "../../lib/websocketListener";
import {ConfigurationContextProvider} from "../../lib/configurationContext";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";
import {ClientMessageEvent} from "../../lib/clientConnectionPool";
import {EchoMessage} from "./command/EchoMessage";
import {HttpServerConfig} from "../../lib/httpServer";

export const EchoServerModule: ModuleConfig = {
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
        {event: ClientMessageEvent.TYPE, command: EchoMessage}
    ]
}
