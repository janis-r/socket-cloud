import {ModuleConfig} from "quiver-framework";
import {LoggerModule} from "../logger";
import {HttpServerModule} from "../httpServer";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";
import {ValidateSocketConnectionEvent} from "../websocketListener";
import {ValidateNewConnection} from "./command/ValidateNewConnection";
import {ConfigurationContextModel} from "./model/ConfigurationContextModel";
import {ConfigurationContextModelSqLite} from "./model/impl/ConfigurationContextModelSqLite";
import {ConfigurationContextApiListener} from "./service/ConfigurationContextApiListener";
import {ConfigurationContextManagerImpl} from "./service/impl/ConfigurationContextManagerImpl";
import {DeleteConfigurationContext} from "./command/DeleteConfigurationContext";
import {DeleteConfigurationContextEvent} from "./event/DeleteConfigurationContextEvent";
import {UpdateConfigurationContext} from "./command/UpdateConfigurationContext";
import {UpdateConfigurationContextEvent} from "./event/UpdateConfigurationContextEvent";
import {ConfigurationContextManager} from "./service/ConfigurationContextManager";

export const configurationContextModule: ModuleConfig = {
    requires: [
        LoggerModule,
        HttpServerModule
    ],
    mappings: [
        {map: ConfigurationContextManager, useType: ConfigurationContextManagerImpl},
        {map: ConfigurationContextProvider, useExisting: ConfigurationContextManager},
        {map: ConfigurationContextModel, useType: ConfigurationContextModelSqLite},
        {map: ConfigurationContextApiListener, instantiate: true}
    ],
    commands: [
        {event: ValidateSocketConnectionEvent.TYPE, command: ValidateNewConnection},
        {event: DeleteConfigurationContextEvent.TYPE, command: DeleteConfigurationContext},
        {event: UpdateConfigurationContextEvent.TYPE, command: UpdateConfigurationContext},
    ],
    /*setup: injector => {
        // This is not a right place to leave this
        injector.get(ConfigurationContextModel).saveConfiguration(
            {
                id: "tests-runner",
                protocol: defaultProtocolId,
                validationApi: {
                    url: "http://localhost:8001/validationAPI",
                    validateNewConnections: true
                },
                pingTimeout: toMilliseconds(30, "seconds"),
                outgoingMessageFragmentSize: 2 ** 14, // 16 kb,
                channelConfig: {
                    "cached-channel": {
                        cachingPolicy: {
                            cacheSize: 100
                        }
                    }
                }
            });
    }*/
};
