import {ModuleConfig} from "quiver-framework";
import {loggerModule} from "../logger";

export const WebsocketConnectionModule: ModuleConfig = {
    requires: [
        loggerModule
    ]
};
