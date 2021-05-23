import { PgConnection } from "../service/PgConnection";
export type Query = typeof PgConnection.prototype.query;
