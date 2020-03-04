import {Event, ModuleConfig} from "quiver-framework";
import {
    ClientConnection,
    ClientConnectionPoolModule,
    ClientMessageEvent,
    ConnectionRemovedEvent,
    NewConnectionEvent
} from "../clientConnectionPool";
import {ConfigurationContextModule} from "../configurationContext/ConfigurationContextModule";
import {HandleNewConnection} from "./command/HandleNewConnection";
import {HandleClientMessage} from "./command/HandleClientMessage";
import {HandleRemovedConnection} from "./command/HandleRemovedConnection";
import {pocmddpProtocol} from "./data/pocmddpProtocol";
import {HttpServerModule} from "../httpServer";
import {DataContextManagerProvider} from "./service/DataContextManagerProvider";
import {AccessTokenManager} from "./service/AccessTokenManager";
import {DataPushApiListener} from "./service/DataPushApiListener";
import {IncomingClientMessageEvent} from "./event/IncomingClientMessageEvent";
import {MessageType} from "./data";
import {UpdateClientSubscriptions} from "./command/UpdateClientSubscriptions";
import {PrepareOutgoingClientMessage} from "./command/PrepareOutgoingClientMessage";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {BroadcastOutgoingMessage} from "./command/BroadcastOutgoingMessage";
import {RestoreClientSubscription} from "./command/RestoreClientSubscription";
import {MessageCache} from "./service/MessageCache";
import {InMemoryMessageCache} from "./service/impl/InMemoryMessageCache";
import {MessageIdProvider} from "./service/MessageIdProvider";
import {InMemoryMessageIdProvider} from "./service/impl/InMemoryMessageIdProvider";
import {DevAccessTokenManager} from "./service/impl/DevAccessTokenManager";

const protocolGuard = ({data: {context: {protocol}}}: Event<ClientConnection>) => protocol === pocmddpProtocol;

export const deliveryProtocolModule: ModuleConfig = {
    requires: [
        ClientConnectionPoolModule,
        ConfigurationContextModule,
        HttpServerModule
    ],
    mappings: [
        {map: DataPushApiListener, instantiate: true},
        DataContextManagerProvider,
        {map: AccessTokenManager, useType: DevAccessTokenManager},
        {map: MessageCache, useType: InMemoryMessageCache},
        {map: MessageIdProvider, useType: InMemoryMessageIdProvider}
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
            guard: ({message: {type}}: IncomingClientMessageEvent) => type === MessageType.PushToServer
        },
        {
            event: IncomingClientMessageEvent.TYPE,
            command: RestoreClientSubscription,
            guard: ({message: {type}}: IncomingClientMessageEvent) => type === MessageType.RestoreRequest
        },
        {event: OutgoingMessageEvent.TYPE, command: BroadcastOutgoingMessage}
    ]
};


