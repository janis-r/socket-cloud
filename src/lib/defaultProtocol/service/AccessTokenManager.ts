import {TokenInfo} from "../data/TokenInfo";

export abstract class AccessTokenManager {

    readonly abstract validateToken: (token: string) => Promise<TokenInfo | null>;
}

