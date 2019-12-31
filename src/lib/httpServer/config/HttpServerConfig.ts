const {env: {HTTP_SERVER_PORT: port}} = process;

export abstract class HttpServerConfig {
    readonly port? = port ? parseInt(port) : 8001;
}
