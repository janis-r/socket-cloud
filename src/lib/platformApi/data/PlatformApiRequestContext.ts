import {TokenInfo} from "../../authorization/data/TokenInfo";
import {ScopedLogger} from "../../logger/util/ScopedLogger";

export type PlatformApiRequestContext = {
    apiCallId: number,
    tokenInfo: TokenInfo,
    logger: ScopedLogger
};
