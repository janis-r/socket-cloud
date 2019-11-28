import {WindowBits} from "../data/WindowBits";

export abstract class PermessageDeflateConfig {

    readonly clientMaxWindowBits: WindowBits = 15;
    readonly serverMaxWindowBits: WindowBits = 15;

    readonly clientNoContextTakeover?: boolean;
    readonly serverNoContextTakeover?: boolean;
}
