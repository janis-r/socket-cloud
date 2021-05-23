import { Module, Optional } from "quiver-framework"
import { httpServerModule } from "../httpServer/httpServerModule";
import { HttpServerService } from "../httpServer/service/HttpServerService";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { SwaggerApiConfig } from "./config/SwaggerApiConfig";

@Module({
    requires: [
        httpServerModule
    ]
})
export class SwaggerApiDisplayModule {
    constructor(@Optional() config: SwaggerApiConfig, { expressApp }: HttpServerService) {
        if (!config) {
            return;
        }

        const { basePath, docs } = config;
        expressApp.use(`/${basePath}`, swaggerUi.serve);

        docs.forEach(({ name, configFile }) => {
            const swaggerDocument = configFile.match(/\.yaml$/i) ? YAML.load(configFile) : require(configFile);
            expressApp.get(
                `/${basePath}/${name}`,
                (req, res, next) => swaggerUi.setup(swaggerDocument)(req, res, next) // This might look silly, although without this inline setup docs would get cached
            );
        });

        expressApp.get(`/${basePath}`, (request, response) => response.send(`
        <html>
            <head>
                <title>API docs</title>
                <style type="text/css">
                    body {
                        margin: 20px;
                        font-family: serif;
                    }
                    a {
                        display: block;
                        text-transform: capitalize;
                    }
                </style>
            </head>
            <body>
                ${docs.map(({ name }) => `<a href='${name}'>${name}</a>`).join('<br />')}
            </body>
        </html>
        `));
    }
}
