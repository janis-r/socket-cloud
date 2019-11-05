import {SessionOptions} from "express-session";

export type SessionData = Express.SessionData;

export abstract class ExpressSession {
    readonly options: SessionOptions;
    readonly getSessionData: (sid: string) => Promise<SessionData>;
}
