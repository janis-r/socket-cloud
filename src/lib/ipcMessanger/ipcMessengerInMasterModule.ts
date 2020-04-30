import {ModuleConfig} from "quiver-framework";
import {workerManagerModule} from "../workerManager/workerManagerModule";
import {WorkerMessageEvent} from "../workerManager/event/WorkerMessageEvent";
import {WorkerMessengerProvider} from "./service/WorkerMessengerProvider";
import {CreateIpcMessageEvent} from "./command/CreateIpcMessageEvent";
import {loggerModule} from "../logger/loggerModule";

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
