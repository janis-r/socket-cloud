import {Inject, Optional} from "qft";
import express, {Express, Router} from "express";
import compression from "compression";
import {json} from "body-parser";
import expressSession from "express-session";
import {ServerConfig} from "../config/ServerConfig";
import {ExpressSession} from "./ExpressSession";

/**
 * Server implementation
 */
export class ExpressServer {

    private expressApp: Express;
    private customRoutes: [Router, string][] = [];

    @Inject()
    private readonly config: ServerConfig;

    @Inject()
    @Optional()
    private readonly session: ExpressSession;

    get started(): boolean {
        return !!this.expressApp;
    }

    async start(): Promise<true> {
        this.expressApp = express();

        const {
            config: {port},
            expressApp, customRoutes,
            session
        } = this;

        expressApp.use(json());
        expressApp.use(compression());
        if (session) {
            expressApp.use(expressSession(session.options));
        }

        customRoutes.forEach(([route, path]) => expressApp.use(path, route));

        return new Promise<true>((resolve, reject) => {
            try {
                expressApp.listen(port, () => {
                    console.log(`Express server started on port: ${port}`);
                    resolve(true);
                });
            } catch (e) {
                console.log(`Express server startup error: ${e}`);
                reject();
            }
        });
    }

    /**
     * Add custom data route to server
     * @param route
     * @param path
     */
    addRoute(route: Router, path = ""): this {
        if (this.started) {
            throw new Error(`Adding routes is permitted only before server is started`);
        }
        const {customRoutes} = this;
        if (path) {
            path = path.toLowerCase();
            if (customRoutes.some(([, existingPath]) => existingPath === path)) {
                throw new Error(`Path ${path} is already registered with a server!`);
            }
        }
        customRoutes.push([route, path]);
        return this;
    }


}
