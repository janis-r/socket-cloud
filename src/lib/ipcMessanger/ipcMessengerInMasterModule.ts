import {ModuleConfig} from "quiver-framework";
import {workerManagerModule, WorkerMessageEvent} from "../workerManager";
import {WorkerMessengerProvider} from "./service/WorkerMessengerProvider";
import {CreateIpcMessageEvent} from "./command/CreateIpcMessageEvent";
import {loggerModule} from "../logger";

export const ipcMessengerInMasterModule: ModuleConfig = {
    requires: [
        workerManagerModule,
        loggerModule
    ],
    mappings: [
        WorkerMessengerProvider
    ],
    commands: [
        {event: WorkerMessageEvent.TYPE, command: CreateIpcMessageEvent}
    ],
    toString: () => "ipcMessengerInMasterModule"
};
