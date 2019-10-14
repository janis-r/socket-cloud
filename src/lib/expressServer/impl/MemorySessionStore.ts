import {Injectable} from "qft";
import {MemoryStore, SessionOptions} from "express-session";
import {ExpressSession} from "../service/ExpressSession";
import {SessionConfig} from "../config/SessionConfig";

type SessionData = Express.SessionData;

@Injectable()
export class MemorySessionStore implements ExpressSession {

    private readonly store: SessionOptions['store'];

    constructor(private readonly config: SessionConfig) {
        this.store = new MemoryStore();
    }

    readonly getOptions = (): SessionOptions => {
        const {config: {sessionOptions}, store: store} = this;
        return {...sessionOptions!, store};
    };

    readonly getSessionData = (sessionId: string) => new Promise<SessionData>((resolve, reject) => {
        this.store!.get(sessionId, ((err, session1) => {
            if (err) {
                console.log(`getSessionData err: ${err}`);
                reject(err);
            } else {
                resolve(session1!);
            }
        }));
    });
}
