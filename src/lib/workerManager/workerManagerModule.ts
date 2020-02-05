import {ModuleConfig} from "qft";
import {WorkerManager} from "./service/WorkerManager";

export const workerManagerModule: ModuleConfig = {
    mappings: [
        {map: WorkerManager, instantiate: true}
    ]
};
