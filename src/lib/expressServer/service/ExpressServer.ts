import {Inject, Optional} from "qft";
import express from "express";
import {Express, Router} from "express";
import compression from "compression";
import {json} from "body-parser";
import expressSession from "express-session";
import {ExpressServerConfig} from "../config/ExpressServerConfig";
import {ExpressSession} from "./ExpressSession";

/**
 * Server implementation
 */
export class ExpressServer {

    private expressApp: Express;
    private customRoutes: [Router, string][] = [];

    @Inject()
    private readonly config: ExpressServerConfig;

    @Inject()
    @Optional()
    private readonly session: ExpressSession;

    /**
     * Start server
     * @returns {Promise<boolean>}
     */
    async start(): Promise<boolean> {
        this.expressApp = express();

        const {
            config: {port},
            expressApp, customRoutes,
            session
        } = this;

        expressApp.use(json());
        expressApp.use(compression());
        if (session) {
            expressApp.use(expressSession(session.getSessionOptions()));
        }

        customRoutes.forEach(([route, path]) => expressApp.use(path, route));

        return new Promise<boolean>(resolve => {
            try {
                expressApp.listen(port, () => {
                    console.log(`Express server started on port: ${port}`);
                    resolve(true);
                });
            } catch (e) {
                console.log(`Express server startup error: ${e}`);
                resolve(false);
            }
        });
    }

    /**
     * Add custom data route to server
     * @param route
     * @param path
     */
    addRoute(route: Router, path = ''): this {
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

    get started(): boolean {
        return !!this.expressApp;
    }
}
