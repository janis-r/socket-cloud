import {ModuleConfig} from "qft";
import {ClientConnectionPool} from "./model/ClientConnectionPool";

export const ClientConnectionModule: ModuleConfig = {
    mappings: [
        ClientConnectionPool
    ]
};
