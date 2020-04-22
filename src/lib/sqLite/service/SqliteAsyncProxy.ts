import {Database} from "sqlite3";
import {QueryResponse} from "../data/QueryResponse";

export class SqliteAsyncProxy {

    constructor(private readonly db: Pick<Database, "run" | "get" | "all"> & Partial<Pick<Database, "exec">>) {
    }

    /**
     * Runs the SQL query with the specified parameters and resolved promise afterwards.
     * It does not retrieve any result data.
     * @param sql The SQL query to run.
     * @param params When the SQL statement contains placeholders, you can pass them in here. They will be bound to
     * the statement before it is executed. There are two ways of passing bind parameters: as an array, and as an
     * object for named parameters. This automatically sanitizes inputs.
     */
    readonly run = async (sql: string, params?: Record<string, any> | any[]) => new Promise<QueryResponse>((resolve, reject) => {
        this.db!.run(sql, params, function (err) {
            if (err) {
                reject(err.message);
            } else {
                const {lastID, changes} = this;
                resolve({lastID, changes});
            }
        });
    });

    /**
     * Runs the SQL query with the specified parameters and calls the callback with the first result row afterwards.
     * @param sql The SQL query to run.
     * @param params When the SQL statement contains placeholders, you can pass them in here. They will be bound to
     * the statement before it is executed. There are two ways of passing bind parameters: as an array, and as an
     * object for named parameters. This automatically sanitizes inputs.
     */
    readonly get = async <T = any>(sql: string, params?: Record<string, any> | any[]) => new Promise<T>((resolve, reject) => {
        this.db!.get(sql, params, function (err, row) {
            if (err) {
                reject(err.message);
            } else {
                resolve(row);
            }
        });
    });

    /**
     * Runs the SQL query with the specified parameters and calls the callback with all result rows afterwards.
     * @param sql The SQL query to run.
     * @param params When the SQL statement contains placeholders, you can pass them in here. They will be bound to
     * the statement before it is executed. There are two ways of passing bind parameters: as an array, and as an
     * object for named parameters. This automatically sanitizes inputs.
     */
    readonly all = async <T = any>(sql: string, params?: Record<string, any> | any[]) => new Promise<T[]>((resolve, reject) => {
        this.db!.all(sql, params, function (err, rows) {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });

    /**
     * Runs all SQL queries in the supplied string. No result rows are retrieved.
     * @param sql The SQL query to run.
     */
    readonly exec = (sql: string) => {
        if (!this.db.exec) {
            throw new Error(`Exec is invoked on object that ain't got one`);
        }
        return new Promise<void>((resolve, reject) =>
            this.db!.exec(sql, err => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve();
                }
            })
        );
    }
}
