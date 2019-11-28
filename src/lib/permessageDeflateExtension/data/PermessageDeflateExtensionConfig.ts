import {WebsocketExtensionConfig} from "../../websocketExtension";
import {PermessageDeflateParam} from "./PermessageDeflateParam";

export type PermessageDeflateExtensionConfig = Omit<WebsocketExtensionConfig, "values"> & {
    values: {
        [PermessageDeflateParam.ClientMaxWindowBits]?: number | undefined,
        [PermessageDeflateParam.ServerMaxWindowBits]?: number,
        [PermessageDeflateParam.ClientNoContextTakeover]?: true,
        [PermessageDeflateParam.ServerNoContextTakeover]?: true,
    }
};
