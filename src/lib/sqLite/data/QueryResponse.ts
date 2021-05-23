export type QueryResponse = {
    // The value of the last inserted row ID
    readonly lastID?: number;
    // Number of rows affected by query
    readonly changes?: number;
}
