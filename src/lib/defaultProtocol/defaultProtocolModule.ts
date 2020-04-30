import {Event, ModuleConfig} from "quiver-framework";
import {ClientConnection} from "../clientConnectionPool/model/ClientConnection";
import {ClientConnectionPoolModule} from "../clientConnectionPool/ClientConnectionPoolModule";
import {ClientMessageEvent} from "../clientConnectionPool/event/ClientMessageEvent";
import {ConnectionRemovedEvent} from "../clientConnectionPool/event/ConnectionRemovedEvent";
import {NewConnectionEvent} from "../clientConnectionPool/event/NewConnectionEvent";
import {configurationContextModule} from "../configurationContext/configurationContextModule";
import {HandleNewConnection} from "./command/HandleNewConnection";
import {HandleClientMessage} from "./command/HandleClientMessage";
import {HandleRemovedConnection} from "./command/HandleRemovedConnection";
import {defaultProtocolId} from "./data/defaultProtocolId";
import {httpServerModule} from "../httpServer/httpServerModule";
import {DataContextManagerProvider} from "./service/DataContextManagerProvider";
import {DataPushApiListener} from "./service/DataPushApiListener";
import {IncomingClientMessageEvent} from "./event/IncomingClientMessageEvent";
import {MessageType} from "./data/MessageType";
import {UpdateClientSubscriptions} from "./command/UpdateClientSubscriptions";
import {PrepareOutgoingClientMessage} from "./command/PrepareOutgoingClientMessage";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {BroadcastOutgoingMessage} from "./command/BroadcastOutgoingMessage";
import {RestoreClientSubscription} from "./command/RestoreClientSubscription";
import {MessageManager} from "./service/MessageManager";
import {authorizationModule} from "../authorization/authorizationModule";
import {DataPushApiCallManager} from "./service/DataPushApiCallManager";
import {DataPushApiCallManagerSqLite} from "./service/impl/DataPushApiCallManagerSqLite";
import {MessageManagerSqLite} from "./service/impl/MessageManagerSqLite";

const protocolGuard = ({data: {context: {protocol}}}: Event<ClientConnection>) => protocol === defaultProtocolId;

export const defaultProtocolModule: ModuleConfig = {
    requires: [
        ClientConnectionPoolModule,
        configurationContextModule,
        httpServerModule,
        authorizationModule
    ],
    mappings: [
        {map: DataPushApiListener, instantiate: true},
        DataContextManagerProvider,
        {map: MessageManager, useType: MessageManagerSqLite},
        {map: DataPushApiCallManager, useType: DataPushApiCallManagerSqLite},
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


