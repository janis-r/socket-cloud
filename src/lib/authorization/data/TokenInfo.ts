import { ConfigurationContext } from "../../configurationContext/data/ConfigurationContext";
import { TokenData } from "./TokenData";

/**
 * Access token data reshaped into format most suitable for public use
 */
export type TokenInfo = { context: ConfigurationContext } & Omit<TokenData, "token" | "contextId">;
