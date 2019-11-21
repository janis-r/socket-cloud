import {ModuleConfig} from "qft";
import {WebSocketListenerConfig} from "./config/WebSocketListenerConfig";
import {WebsocketListener} from "./service/WebsocketListener";
import {SocketListenerBaseModule} from "./SocketListenerBaseModule";

export const WebSocketListenerModule: ModuleConfig = {
    requires: [
        SocketListenerBaseModule
    ],
    mappings: [
        WebSocketListenerConfig,
        {map: WebsocketListener, asSingleton: true, instantiate: true}
    ]
};
