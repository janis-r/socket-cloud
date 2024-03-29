import { ScopedLogger } from "../../../logger/util/ScopedLogger";


export abstract class PlatformApiCallManager {

    /**
     * Create api call logger
     * @param data Api call init data
     */
    abstract registerApiCall(data: Record<string, any>): Promise<Readonly<{ id: number, logger: ScopedLogger }>>;
}
