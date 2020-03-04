import {ModuleConfig} from "quiver-framework";
import {LoggerModule} from "../logger";

export const WebsocketConnectionModule: ModuleConfig = {
    requires: [
        LoggerModule
    ]
};
