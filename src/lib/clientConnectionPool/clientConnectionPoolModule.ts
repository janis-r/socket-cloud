import { ModuleConfig } from "quiver-framework";
import { ClientConnectionPool } from "./model/ClientConnectionPool";

export const clientConnectionPoolModule: ModuleConfig = {
    mappings: [
        ClientConnectionPool
    ]
};
