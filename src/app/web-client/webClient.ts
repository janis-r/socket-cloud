import {WebSocketAdapter} from "@defaultProtocolClient/model/WebSocketAdapter";
import {SocketClient} from "@defaultProtocolClient/model/SocketClient";

export const createClient = (url: string) => new SocketClient(new WebSocketAdapter(url));
export const version = "__buildVersion__";
