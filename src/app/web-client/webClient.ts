import {WebSocketAdapter} from "../../lib/defaultProtocolClient/model/WebSocketAdapter";
import {SocketClient} from "../../lib/defaultProtocolClient/model/SocketClient";

export const createClient = (url: string) => new SocketClient(new WebSocketAdapter(url));
export const version = "__buildVersion__";
