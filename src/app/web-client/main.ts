import {WebSocketAdapter} from "../../lib/deliveryProtocolClient/model/WebSocketAdapter";
import {SocketClient} from "../../lib/deliveryProtocolClient/model/SocketClient";

export const createClient = (url: string) => new SocketClient(new WebSocketAdapter(url));
