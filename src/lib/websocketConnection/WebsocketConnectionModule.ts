import {ModuleConfig} from "qft";
import {LoggerModule} from "../logger";

export const WebsocketConnectionModule: ModuleConfig = {
    requires: [
        LoggerModule
    ]
};
