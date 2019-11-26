import {WebsocketExtensionConfig} from "../../websocketExtension";
import {PermessageDeflateParam} from "./PermessageDeflateParam";

export type PermessageDeflateExtensionConfig = Omit<WebsocketExtensionConfig, "values"> & {
    values: Record<PermessageDeflateParam, string | number | undefined>
};
