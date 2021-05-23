import { TokenData } from "../data/TokenData";
import { ContextId } from "../../configurationContext/data/ContextId";
import { AccessConfiguration } from "../data/AccessConfiguration";

/**
 * Data model that abstracts retrieval and saving of access token configuration into external storage,
 * whatever implemented.
 */
export abstract class AccessTokenDataModel {
    /**
     * Create access entry
     * @param contextId Configuration context scope
     * @param permissions Access permissions to be granted for new entry
     * @returns Token data that shall identify newly created entry
     */
    abstract readonly createAccessEntry: (contextId: ContextId, permissions: AccessConfiguration) => Promise<TokenData["token"]>;

    /**
     * Retrieve access token data.
     * @param token
     */
    abstract readonly getTokenData: (token: TokenData["token"]) => Promise<TokenData | null>;

    /**
     * Retrieve list of access tokens by context id
     */
    abstract readonly getTokensByContext: (contextId: ContextId) => Promise<Array<TokenData>>;

    /**
     * Delete access token data.
     * @param token
     */
    abstract readonly deleteTokenData: (token: TokenData["token"]) => Promise<boolean>;
}
