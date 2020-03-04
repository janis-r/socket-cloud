import {ModuleConfig} from "quiver-framework";
import {workerManagerModule, WorkerMessageEvent} from "../workerManager";
import {WorkerMessengerProvider} from "./service/WorkerMessengerProvider";
import {CreateIpcMessageEvent} from "./command/CreateIpcMessageEvent";
import {LoggerModule} from "../logger";

export const ipcMessengerInMasterModule: ModuleConfig = {
    requires: [
        workerManagerModule,
        LoggerModule
    ],
    mappings: [
        WorkerMessengerProvider
    ],
    commands: [
        {event: WorkerMessageEvent.TYPE, command: CreateIpcMessageEvent}
    ],
    toString: () => "ipcMessengerInMasterModule"
};
