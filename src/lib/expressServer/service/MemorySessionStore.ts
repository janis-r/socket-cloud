import {Injectable} from "qft";
import {MemoryStore, SessionOptions} from "express-session";
import {ExpressSession} from "./ExpressSession";
import {SessionConfig} from "../config/SessionConfig";

type SessionData = Express.SessionData;

@Injectable()
export class MemorySessionStore implements ExpressSession {

    readonly options: SessionOptions;
    private readonly store: SessionOptions['store'];

    constructor(private readonly config: SessionConfig) {
        this.store = new MemoryStore();
        this.options = {...config.sessionOptions!, store: this.store};
    }

    readonly getSessionData = (sessionId: string) => new Promise<SessionData>((resolve, reject) => {
        this.store!.get(sessionId, ((err, data) => {
            if (err) {
                console.log(`getSessionData err: ${err}`);
                reject(err);
            } else {
                resolve(data!);
            }
        }));
    });
}
