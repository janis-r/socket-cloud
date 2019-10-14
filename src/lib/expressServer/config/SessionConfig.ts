import {SessionOptions} from "express-session";

export abstract class SessionConfig {
    readonly sessionOptions?: SessionOptions;
    readonly sessionStoreHosts?: string[];
}
