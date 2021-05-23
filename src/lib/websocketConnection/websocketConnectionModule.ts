import { ModuleConfig } from "quiver-framework";
import { loggerModule } from "../logger/loggerModule";

export const websocketConnectionModule: ModuleConfig = {
    requires: [
        loggerModule
    ]
};
