import {ModuleConfig} from "qft";
import {ClientConnectionPool} from "./model/ClientConnectionPool";
import {DispatchSyntheticEvent} from "./command/DispatchSyntheticEvent";
import {ClientMessageEvent} from "./event/ClientMessageEvent";
import {ConnectionRemovedEvent} from "./event/ConnectionRemovedEvent";
import {NewConnectionEvent} from "./event/NewConnectionEvent";

export const ClientConnectionPoolModule: ModuleConfig = {
    mappings: [
        ClientConnectionPool
    ],
    commands: [
        {event: NewConnectionEvent.TYPE, command: DispatchSyntheticEvent},
        {event: ClientMessageEvent.TYPE, command: DispatchSyntheticEvent},
        {event: ConnectionRemovedEvent.TYPE, command: DispatchSyntheticEvent},
    ]
};
