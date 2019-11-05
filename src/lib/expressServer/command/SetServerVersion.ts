import { Command, Optional, Inject } from "qft";
import {VersionConfig} from "../config/VersionConfig";
import {ExpressServer} from "..";
import {Router} from "express";

export class SetServerVersion implements Command {

    @Inject()
    @Optional()
    private config: VersionConfig;

    @Inject()
    private server: ExpressServer;

    execute() {
        const {config, server} = this;
        if (!config) {
            return;
        }

        server.addRoute(Router().get('', (req, res) => res.json(config)), "v");
    }

}
