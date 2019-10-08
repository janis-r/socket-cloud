import {ExpressServerConfig} from "../config/ExpressServerConfig";
import {SessionOptions} from "express-session";
import {toMilliseconds} from "ugd10a";

export class NodeEnvConfig implements ExpressServerConfig {

    readonly port = parseInt(process.env.PORT!) || 3001;
    readonly sessionStoreHosts: string[];
    readonly sessionOptions: SessionOptions;

    constructor() {
        const {env: {SESSION_STORE_HOSTS}} = process;
        if (SESSION_STORE_HOSTS) {
            this.sessionStoreHosts = SESSION_STORE_HOSTS.split(",");
        } else {
            this.sessionStoreHosts = ["127.0.0.1:11211"];
        }

        this.sessionOptions = {
            secret: "scrible-skrable-skruble",
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: toMilliseconds(24, "hours") * 30
            }
        }
    }


}
