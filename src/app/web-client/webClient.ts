import {WebSocketAdapter} from "@deliveryProtocolClient/model/WebSocketAdapter";
import {SocketClient} from "@deliveryProtocolClient/model/SocketClient";

export const createClient = (url: string) => new SocketClient(new WebSocketAdapter(url));
export const version = "__buildVersion__";
