import {ModuleConfig} from "qft";
import {WebSocketConfig} from "./config/WebSocketConfig";
import {WebSocketListener} from "./service/WebSocketListener";
import {LoggerModule} from "../logger";

/**
 *
 */
export const WebSocketListenerModule: ModuleConfig = {
    requires: [
        LoggerModule
    ],
    mappings: [
        WebSocketConfig,
        {map: WebSocketListener, instantiate: true}
    ]
};
