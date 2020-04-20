import {ScopedLogger} from "../util/ScopedLogger";

export abstract class DataPushApiCallManager {

    /**
     * Create api call logger
     * @param data Api call init data
     */
    abstract registerApiCall(data: Record<string, any>): Promise<Readonly<{ id: number, logger: ScopedLogger }>>;
}
