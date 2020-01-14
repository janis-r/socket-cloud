export abstract class SwaggerApiConfig {
    readonly basePath: string;
    readonly docs: Array<{ name: string, configFile: string }>;
}
