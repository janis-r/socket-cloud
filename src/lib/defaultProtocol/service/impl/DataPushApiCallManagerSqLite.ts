import {DataPushApiCallManager} from "../DataPushApiCallManager";
import {SqLiteConnection} from "../../../sqLite/service/SqLiteConnection";
import {ScopedLogger} from "../../util/ScopedLogger";

export class DataPushApiCallManagerSqLite implements DataPushApiCallManager {

    private readonly db: SqLiteConnection;

    constructor() {
        try {
            this.db = new SqLiteConnection("db/data-push-api-call.db");
            this.db.ready.then(() => this.initialize());
        } catch (e) {
            console.error(`Error while connecting to Sqlite: ${e.message}`);
        }
    }

    private async initialize() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS data_push_api_call
            (
                id   INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
                time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                data TEXT,
                log  TEXT
            );
        `);
    }

    async registerApiCall(data: Record<string, any>): Promise<{ id: number, logger: ScopedLogger }> {
        const {db: {run}} = this;

        const time = Date.now();
        const {lastID: id} = await run(`
                    INSERT INTO data_push_api_call (data)
                    VALUES (?);
            `,
            [JSON.stringify(data)]
        );
        return {
            id,
            logger: new ScopedLogger(time, data => run(`
                        UPDATE data_push_api_call
                        SET log = ?
                        WHERE id = ?;
                `,
                [data, id]
            ))
        };
    }

}


