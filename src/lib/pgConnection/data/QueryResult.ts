import { QueryResult as PgQueryResult } from "pg";

export type QueryResult<T = any> = Omit<PgQueryResult, "rows"> & { rows: T[] };
