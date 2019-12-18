import * as http from "http";
import {Context, InjectionConfig, Injector, ModuleConfig, WebApplicationBundle} from "qft";
import * as fs from "fs";
import {WebSocketListenerConfig, WebsocketListenerModule} from "../../lib/websocketListener";
import {Logger} from "../../lib/logger";
import {HttpMethod} from "../../lib/types/HttpMethod";
import {ConfigurationContextProvider} from "../../lib/configurationContext";
import {SocketDescriptor} from "../../lib/websocketListener/data/SocketDescriptor";
import {PermessageDeflateConfig, PermessageDeflateExtensionModule} from "../../lib/permessageDeflateExtension";

const httpServerPort = 8000;
let contextInjector: Injector;

const initHttpServer = async (port = httpServerPort) => {
    const server = http.createServer(async (req, res) => {
        const {method, url} = req;
        console.log({method, url});

        if (method == HttpMethod.GET && url === '/') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(fs.readFileSync(`${__dirname}/index.html`));
            res.end();
            return;
        }

        if (method == HttpMethod.POST && url === '/validate-socket') {
            await new Promise<void>(resolve => {
                const chunks: Buffer[] = [];
                req.on("data", chunk => chunks.push(chunk));
                req.on("end", () => {
                    console.log({body: JSON.parse(Buffer.concat(chunks).toString("utf8"))});
                    resolve();
                });
            });
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(true));
            res.end();
            return;
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(`url:${req.url}, method: ${req.method}`);
        res.end();
    });
    server.listen(port, () => console.log(`Http server running at http://localhost:${port}`));
};

const initSocket = async () => {
    const {injector} = new Context()
        .install(...WebApplicationBundle)
        .configure(
            WebsocketListenerModule,
            PermessageDeflateExtensionModule,
            <ModuleConfig>{
                mappings: [
                    {
                        map: WebSocketListenerConfig,
                        useValue: <WebSocketListenerConfig>{webSocketPort: 9001},
                    } as InjectionConfig<WebSocketListenerConfig>,
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
                ]
            },
        )
        .initialize();
    injector.get(Logger).console(`Web socket context initialized`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    contextInjector = injector;
};

initHttpServer().then(initSocket);
