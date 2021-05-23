import { WindowBits } from "../data/WindowBits";

export abstract class PermessageDeflateConfig {

    readonly clientMaxWindowBits?: WindowBits;
    readonly serverMaxWindowBits?: WindowBits;

    readonly clientNoContextTakeover?: boolean;
    readonly serverNoContextTakeover?: boolean;
}
