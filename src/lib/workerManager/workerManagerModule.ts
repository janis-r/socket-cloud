import {ModuleConfig} from "quiver-framework";
import {WorkerManager} from "./service/WorkerManager";

export const workerManagerModule: ModuleConfig = {
    mappings: [
        {map: WorkerManager, instantiate: true}
    ],
    toString: () => "workerManagerModule"
};
