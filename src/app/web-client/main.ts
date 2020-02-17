import {SocketClient, WebSocketAdapter} from "../../lib/deliveryProtocolClient";

export const createClient = (url: string) => new SocketClient(new WebSocketAdapter(url));
