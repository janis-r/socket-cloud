import {ModuleConfig} from "qft";
import {
    ClientConnectionPoolModule,
    ClientMessageEvent,
    ConnectionRemovedEvent,
    NewConnectionEvent
} from "../clientConnectionPool";
import {ConfigurationContextModule} from "../configurationContext";
import {HandleNewConnection} from "./command/HandleNewConnection";
import {HandleClientMessage} from "./command/HandleClientMessage";
import {DataContextManagerProvider} from "./service/DataContextManagerProvider";
import {HandleRemovedConnection} from "./command/HandleRemovedConnection";

export const DeliveryProtocolModule: ModuleConfig = {
    requires: [
        ClientConnectionPoolModule,
        ConfigurationContextModule
    ],
    mappings: [
        DataContextManagerProvider
    ],
    commands: [
        {event: NewConnectionEvent.TYPE, command: HandleNewConnection},
        {event: ClientMessageEvent.TYPE, command: HandleClientMessage},
        {event: ConnectionRemovedEvent.TYPE, command: HandleRemovedConnection}
    ]
};
