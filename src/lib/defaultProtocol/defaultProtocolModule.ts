import {Event, ModuleConfig} from "quiver-framework";
import {ClientConnection} from "../clientConnectionPool/model/ClientConnection";
import {clientConnectionPoolModule} from "../clientConnectionPool/clientConnectionPoolModule";
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
import {IncomingClientMessageEvent} from "./event/IncomingClientMessageEvent";
import {MessageType} from "./data/MessageType";
import {UpdateClientSubscriptions} from "./command/UpdateClientSubscriptions";
import {PrepareOutgoingClientMessage} from "./command/PrepareOutgoingClientMessage";
import {OutgoingMessageEvent} from "./event/OutgoingMessageEvent";
import {BroadcastOutgoingMessage} from "./command/BroadcastOutgoingMessage";
import {RestoreClientSubscription} from "./command/RestoreClientSubscription";
import {MessageManager} from "./service/MessageManager";
import {authorizationModule} from "../authorization/authorizationModule";
import {PlatformApiCallManager} from "./service/PlatformApiCallManager";
import {PlatformApiCallManagerSqLite} from "./service/impl/PlatformApiCallManagerSqLite";
import {MessageManagerSqLite} from "./service/impl/MessageManagerSqLite";
import {PublishingApiListener} from "./service/api/PublishingApiListener";

const defaultProtocolGuard = ({data: {context: {protocol}}}: Event<ClientConnection>) => protocol === defaultProtocolId;

export const defaultProtocolModule: ModuleConfig = {
    requires: [
        clientConnectionPoolModule,
        configurationContextModule,
        httpServerModule,
        authorizationModule
    ],
    mappings: [
        {map: PublishingApiListener, instantiate: true},
        DataContextManagerProvider,
        {map: MessageManager, useType: MessageManagerSqLite},
        {map: PlatformApiCallManager, useType: PlatformApiCallManagerSqLite},
    ],
    commands: [
        {event: NewConnectionEvent.TYPE, command: HandleNewConnection, guard: defaultProtocolGuard},
        {event: ConnectionRemovedEvent.TYPE, command: HandleRemovedConnection, guard: defaultProtocolGuard},
        {event: ClientMessageEvent.TYPE, command: HandleClientMessage, guard: defaultProtocolGuard},
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


