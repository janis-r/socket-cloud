const {env: {
    HTTP_SERVER_PORT: port,
    HTTPS_PRIVATE_KEY: privateKey,
    HTTPS_CERTIFICATE: certificate
}} = process;

export abstract class HttpServerConfig {
    readonly port? = port ? parseInt(port) : 8001;
    readonly httpsCredentials? = privateKey && certificate ? {privateKey, certificate} : null;
}
