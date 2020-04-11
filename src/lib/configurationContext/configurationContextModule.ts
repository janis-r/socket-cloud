import {ModuleConfig} from "quiver-framework";
import {loggerModule} from "../logger";
import {ConfigurationContextProvider} from "./service/ConfigurationContextProvider";
import {ConfigurationContextModel} from "./model/ConfigurationContextModel";
import {ConfigurationContextModelSqLite} from "./model/impl/ConfigurationContextModelSqLite";
import {httpServerModule} from "../httpServer";
import {authorizationModule} from "../authorization";

export const configurationContextModule: ModuleConfig = {
    requires: [
        loggerModule,
        httpServerModule,
        authorizationModule
    ],
    mappings: [
        ConfigurationContextProvider,
        {map: ConfigurationContextModel, useType: ConfigurationContextModelSqLite},
        // {
        //     map: ConfigurationContextApiConfig,
        //     useValue: {apiKey: process?.env?.CONFIGURATION_CONTEXT_API_KEY || "DEV::CONFIGURATION_CONTEXT_API_KEY"}
        // } as InjectionConfig<ConfigurationContextApiConfig>,
        // {map: ConfigurationContextApiListener, instantiate: true}
    ],
    commands: [
        // {event: ValidateSocketConnectionEvent.TYPE, command: ValidateNewConnection},
        // {event: DeleteConfigurationContextEvent.TYPE, command: DeleteConfigurationContext},
        // {event: UpdateConfigurationContextEvent.TYPE, command: UpdateConfigurationContext},
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
