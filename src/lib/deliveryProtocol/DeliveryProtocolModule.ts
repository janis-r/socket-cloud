import {Event, ModuleConfig} from "qft";
import {
    ClientConnection,
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
import {protocolName} from "./protocolName";
import {HttpServerModule} from "../httpServer";
import {AccessTokenManager} from "./service/AccessTokenManager";
import {DataPushApiListener} from "./service/DataPushApiListener";
import {IncomingClientMessageEvent} from "./event/IncomingClientMessageEvent";
import {MessageType} from "./data";
import {UpdateClientSubscriptions} from "./command/UpdateClientSubscriptions";
import {PrepareOutgoingClientMessage} from "./command/PrepareOutgoingClientMessage";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {BroadcastOutgoingMessage} from "./command/BroadcastOutgoingMessage";

const protocolGuard = ({data: {context: {protocol}}}: Event<ClientConnection>) => protocol === protocolName;

export const DeliveryProtocolModule: ModuleConfig = {
    requires: [
        ClientConnectionPoolModule,
        ConfigurationContextModule,
        HttpServerModule
    ],
    mappings: [
        DataContextManagerProvider,
        {map: DataPushApiListener, instantiate: true},
        AccessTokenManager
    ],
    commands: [
        {event: NewConnectionEvent.TYPE, command: HandleNewConnection, guard: protocolGuard},
        {event: ConnectionRemovedEvent.TYPE, command: HandleRemovedConnection, guard: protocolGuard},
        {event: ClientMessageEvent.TYPE, command: HandleClientMessage, guard: protocolGuard},
        {
            event: IncomingClientMessageEvent.TYPE,
            command: UpdateClientSubscriptions,
            guard: ({message: {type}}: IncomingClientMessageEvent) => [
                MessageType.Subscribe,
                MessageType.Unsubscribe
            ].includes(type)
        },
        {
            event: IncomingClientMessageEvent.TYPE,
            command: PrepareOutgoingClientMessage,
            guard: ({message: {type}}: IncomingClientMessageEvent) => type === MessageType.Push
        },
        // {
        //     event: IncomingClientMessageEvent.TYPE,
        //     command: RestoreClientSubscription,
        //     guard: ({message: {type}}: IncomingClientMessageEvent) => type === MessageType.Restore
        // },

        {event: OutgoingMessageEvent.TYPE, command: BroadcastOutgoingMessage}
    ]
};


