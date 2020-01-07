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
import {syntheticEventType} from "../utils/SyntheticEvent";
import {protocolName} from "./protocolName";

const protocol = protocolName;

export const DeliveryProtocolModule: ModuleConfig = {
    requires: [
        ClientConnectionPoolModule,
        ConfigurationContextModule
    ],
    mappings: [
        DataContextManagerProvider
    ],
    commands: [
        {
            event: syntheticEventType({type: NewConnectionEvent.TYPE, protocol}),
            command: HandleNewConnection
        },
        {
            event: syntheticEventType({type: ClientMessageEvent.TYPE, protocol}),
            command: HandleClientMessage
        },
        {
            event: syntheticEventType({type: ConnectionRemovedEvent.TYPE, protocol}),
            command: HandleRemovedConnection
        }
    ]
};
