import {toMilliseconds} from "ugd10a";
import {setTimeout} from "timers";

export class ScopedLogger {

    private _committed = false;
    private autoCommitTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly dataLog = new Array<[number, any]>();

    /**
     * Create new instance
     * @param startTime Epoch value of time as this instance was created
     * @param save
     */
    constructor(readonly startTime: number, private save: (data: string) => void) {
        this.autoCommitTimeoutId = setTimeout(
            this.autoCommit,
            toMilliseconds(10, "seconds")
        );
    }

    /**
     * Defines if logger is already committed and thus is not functional any more
     */
    get committed() {
        return this._committed;
    }

    /**
     * Add log to api call log
     * @param data Anything that should be added to log
     */
    log(data: any): this {
        const {_committed, dataLog, startTime} = this;
        if (_committed) {
            throw new Error(`Can't log - already committed`);
        }
        dataLog.push([Date.now() - startTime, data]);
        return this;
    }

    /**
     * Commit log thus closing logger session.
     */
    commit(): void {
        if (this._committed) {
            throw new Error(`Can't commit - already committed`);
        }
        this.log('commit');
        if (this.autoCommitTimeoutId) {
            clearTimeout(this.autoCommitTimeoutId);
        }
        this.saveLoggedData();
        this._committed = true;
    }

    private readonly autoCommit = (): void => {
        this.autoCommitTimeoutId = null;
        if (this.dataLog.length) {
            this.log("auto-commit");
            this.saveLoggedData();
        }
    };

    private saveLoggedData(): void {
        const {dataLog, save} = this;
        if (dataLog.length) {
            save(JSON.stringify(dataLog));
        }
    }
}
