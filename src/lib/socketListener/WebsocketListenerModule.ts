import {ModuleConfig} from "qft";
import {WebSocketListenerConfig} from "./config/WebSocketListenerConfig";
import {WebsocketListener} from "./service/WebsocketListener";
import {SocketListenerBaseModule} from "./SocketListenerBaseModule";
import {WebsocketConnectionValidationRequest} from "./event/WebsocketConnectionValidationRequest";
import {ValidateNewWebsocket} from "./command/ValidateNewWebsocket";

export const WebsocketListenerModule: ModuleConfig = {
    requires: [
        SocketListenerBaseModule
    ],
    mappings: [
        WebSocketListenerConfig,
        {map: WebsocketListener, asSingleton: true, instantiate: true}
    ],
    commands: [
        {event: WebsocketConnectionValidationRequest.TYPE, command: ValidateNewWebsocket}
    ]
};
