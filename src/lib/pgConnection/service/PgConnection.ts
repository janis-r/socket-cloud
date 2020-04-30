import {Inject} from "quiver-framework";
import {Timer} from "ugd10a";
import {Logger} from "../../logger/service/Logger";
import {Pool, PoolClient, PoolConfig, QueryConfig} from "pg";
import {PgConfig} from "../data/PgConfig";
import {Query} from "../data/Query";
import {QueryResult} from "../data/QueryResult";

/**
 * Postgres connection service
 */
export class PgConnection {

    @Inject()
    private readonly logger: Logger;
    private connection: Pool;
    private connected: boolean;

    private initPromise: Promise<boolean>;

    constructor(private readonly config: PgConfig) {
        this.initialized();
    }

    /**
     * Check if db connection is initialized
     */
    initialized(): Promise<boolean> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise<boolean>(async resolve => {
            const {config: {host, database, port, user, password}, logger: {error}} = this;
            const partialConfig: PoolConfig = {host, database, port, user, password};

            const time = new Timer();
            this.connection = new Pool(partialConfig);
            try {
                await this.connection.connect();
                this.connected = true;
                resolve(true);
            } catch (err) {
                error(`Database connection error: [${err.message}], time taken ${time.elapsed}ms`);
                resolve(false);
            }
        });

        return this.initPromise;
    }

    /**
     * Run query
     * @param queryConfig
     */
    readonly query = async <T = any>(queryConfig: QueryConfig): Promise<QueryResult<T> | null> => {
        if (!this.connected) {
            throw new Error("DataBase query method invoked before DB is connected!");
        }
        return this.executeQuery(queryConfig);
    };

    /**
     * Spawn new connection that can be used to execute queries with BEGIN/COMMIT/ROLLBACK
     */
    readonly spawnConnection = async (): Promise<{ query: Query, release: PoolClient["release"] }> => {
        if (!this.connected) {
            throw new Error("DataBase is not connected and spawnConnection should not be used prior to that!");
        }

        const connection = await this.connection.connect();
        return {
            query: <T = any>(queryConfig: QueryConfig) => this.executeQuery<T>(queryConfig),
            release: (err?: Error) => connection.release(err)
        };
    };

    private async executeQuery<T = any>(queryConfig: QueryConfig): Promise<QueryResult<T> | null> {
        if (!this.connected) {
            throw new Error("DataBase query method invoked before DB is connected!");
        }

        const {values, text} = queryConfig;
        const {connection, logger: {error: logError, console: logToConsole, notice: logNotice}, config: {slowQueryThreshold}} = this;

        const time = new Timer();
        const cleanQuery = text.replace(/\s+/g, ' ').replace(/^\s+/, '');
        const queryValues = values && values.length ? JSON.stringify(values) : '[]';
        const queryId = Math.floor(Math.random() * 0xFFFFFF).toString(16);

        try {
            time.reset();
            const result = await connection.query(queryConfig);
            logToConsole(`[${queryId}] DB query executed in ${time.elapsed} ms and returned ${result.rowCount} rows:\n${cleanQuery}\nValues: ${queryValues}`);
            if (time.elapsed > slowQueryThreshold) {
                logNotice(`[${queryId}] [SQL slow] Time: ${time.elapsed}ms, Query: ${cleanQuery}, Values: ${queryValues}`)
            }
            return result;
        } catch ({message}) {
            const errorMessage = message.match(/^.*$/)[0];
            logError(`[${queryId}] Could not execute query! Query: ${cleanQuery}, Values: ${queryValues}, Error: ${errorMessage}`);
        }

        return null;
    };

}

