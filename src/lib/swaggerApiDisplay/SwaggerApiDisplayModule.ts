import {Module, Optional} from "qft"
import {HttpServerModule, HttpServerRouter, HttpServerService} from "../httpServer";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import {SwaggerApiConfig} from "./config/SwaggerApiConfig";

@Module({
    requires: [
        HttpServerModule
    ]

})
export class SwaggerApiDisplayModule {
    constructor(@Optional() config: SwaggerApiConfig, {expressApp}: HttpServerService, router: HttpServerRouter) {
        if (!config) {
            return;
        }

        const {basePath, docs} = config;
        expressApp.use(`/${basePath}`, swaggerUi.serve);

        docs.forEach(({name, configFile}) => {
            expressApp.get(
                `/${basePath}/${name}`,
                swaggerUi.setup(configFile.match(/\.yaml$/i) ? YAML.load(configFile) : configFile)
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
                ${docs.map(({name}) => `<a href='${name}'>${name} API</a>`).join('<br />')}
            </body>
        </html>
        `));
    }
}
