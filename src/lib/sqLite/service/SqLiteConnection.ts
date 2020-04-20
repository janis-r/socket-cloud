import {Database, OPEN_CREATE, OPEN_READWRITE, verbose} from "sqlite3";

// TODO: This should be enabled only in dev/debug mode
verbose();

/**
 * Sqlite connection.
 * Partial implementation of Database class from sqlite3 module refactored for async flow.
 */
export class SqLiteConnection {

    /**
     * Defines if connection is established
     */
    readonly ready?: Promise<SqLiteConnection>;

    private _closed: boolean = false;

    private readonly db?: Database;

    /**
     * Create new connection
     * @param filename Filename to connect to or string ':memory:' to create in memory database
     * @param mode Binary flags to identify connection mode OPEN_CREATE | OPEN_READWRITE | OPEN_READONLY
     */
    constructor(readonly filename: ":memory:" | string, readonly mode = OPEN_READWRITE | OPEN_CREATE) {
        let readyCallback: (connection: this) => void;
        this.ready = new Promise<this>(resolve => readyCallback = resolve);
        this.db = new Database(filename, mode, err => {
            if (err) {
                throw err;
            }
            readyCallback(this);
        });
    }

    /**
     * Defines if connection is closed.
     */
    get closed(): boolean {
        return this._closed;
    }

    /**
     * Closes the database.
     */
    readonly close = () => {
        this._closed = true;
        return new Promise<void>((resolve, reject) => this.db.close(err => err ? reject(err) : resolve()));
    };

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
    readonly exec = (sql: string) => new Promise<void>((resolve, reject) =>
        this.db!.exec(sql, err => {
            if (err) {
                reject(err.message);
            } else {
                resolve();
            }
        })
    );

    readonly prepare = (sql: string) => this.db.prepare(sql);
}

type QueryResponse = {
    // The value of the last inserted row ID
    readonly lastID?: number;
    // Number of rows affected by query
    readonly changes?: number;
}
