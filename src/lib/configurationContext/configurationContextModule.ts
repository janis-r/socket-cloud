import {ModuleConfig} from "quiver-framework";
import {loggerModule} from "../logger/loggerModule";
import {httpServerModule} from "../httpServer/httpServerModule";
import {authorizationModule} from "../authorization/authorizationModule";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";
import {ConfigurationContextModel} from "./model/ConfigurationContextModel";
import {ConfigurationContextModelSqLite} from "./model/impl/ConfigurationContextModelSqLite";
import {ConfigurationContextApiListener} from "./service/ConfigurationContextApiListener";
import {ValidateSocketConnectionEvent} from "../websocketListener/event/ValidateSocketConnectionEvent";
import {DeleteConfigurationContext} from "./command/DeleteConfigurationContext";
import {UpdateConfigurationContextEvent} from "./event/UpdateConfigurationContextEvent";
import {ValidateNewConnection} from "./command/ValidateNewConnection";
import {UpdateConfigurationContext} from "./command/UpdateConfigurationContext";
import {DeleteConfigurationContextEvent} from "./event/DeleteConfigurationContextEvent";

export const configurationContextModule: ModuleConfig = {
    requires: [
        loggerModule,
        httpServerModule,
        authorizationModule
    ],
    mappings: [
        ConfigurationContextProvider,
        {map: ConfigurationContextModel, useType: ConfigurationContextModelSqLite},
        {map: ConfigurationContextApiListener, instantiate: true}
    ],
    commands: [
        {event: ValidateSocketConnectionEvent.TYPE, command: ValidateNewConnection},
        {event: DeleteConfigurationContextEvent.TYPE, command: DeleteConfigurationContext},
        {event: UpdateConfigurationContextEvent.TYPE, command: UpdateConfigurationContext},
    ]
};
