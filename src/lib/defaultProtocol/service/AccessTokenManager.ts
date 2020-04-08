import {TokenInfo} from "../data/TokenInfo";

// TODO: Move this into separate module that would cover authorization in general
export abstract class AccessTokenManager {

    readonly abstract validateToken: (token: string) => Promise<TokenInfo | null>;
}

