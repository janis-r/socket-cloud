import {SessionOptions} from "express-session";

export abstract class ExpressServerConfig {
    readonly port: number;
    readonly sessionOptions: SessionOptions;
    readonly sessionStoreHosts: string[];
}