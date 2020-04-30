import {ModuleConfig} from "quiver-framework";
import {loggerModule} from "../logger/loggerModule";

export const WebsocketConnectionModule: ModuleConfig = {
    requires: [
        loggerModule
    ]
};
