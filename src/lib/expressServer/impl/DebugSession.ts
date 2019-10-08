import {Injectable} from "qft";
import {BaseMemoryStore, MemoryStore, SessionOptions} from "express-session";
import {ExpressServerConfig} from "..";
import {ExpressSession} from "../service/ExpressSession";

type SessionData = Express.SessionData;

@Injectable()
export class DebugSession implements ExpressSession {

    private sessionStore: BaseMemoryStore;

    constructor(private readonly config: ExpressServerConfig) {
        this.sessionStore = new MemoryStore();
    }


    getSessionOptions(): SessionOptions {
        const {config: {sessionOptions}} = this;
        return {
            ...sessionOptions,
            store: this.sessionStore as any
        };
    };

    readonly getSessionData = (sid: string) => new Promise<SessionData>((resolve, reject) => {
        this.sessionStore.get(sid, ((err, session1) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(session1!);
            }
        }));
    });
}
