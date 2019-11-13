import {ModuleConfig} from "qft";
import {WebSocketListenerConfig} from "./config/WebSocketListenerConfig";
import {WebSocketListener} from "./service/WebSocketListener";
import {SocketListenerBaseModule} from "./SocketListenerBaseModule";

export const WebSocketListenerModule: ModuleConfig = {
    requires: [
        SocketListenerBaseModule
    ],
    mappings: [
        WebSocketListenerConfig,
        {map: WebSocketListener, asSingleton: true, instantiate: true}
    ]
};
