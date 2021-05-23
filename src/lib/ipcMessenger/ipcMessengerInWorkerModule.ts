import { EventDispatcher, ModuleConfig } from "quiver-framework";
import { IpcMessenger } from "./service/IpcMessenger";
import { IpcMessageEvent } from "./event/IpcMessageEvent";
import { loggerModule } from "../logger/loggerModule";

export const ipcMessengerInWorkerModule: ModuleConfig = {
    requires: [
        loggerModule
    ],
    mappings: [
        { map: IpcMessenger, instantiate: true, useFactory: () => IpcMessenger.fromCurrentProcess() }
    ],
    setup: injector => {
        const eventDispatcher = injector.get(EventDispatcher);
        const messenger = injector.get(IpcMessenger);
        messenger.onMessage(message => eventDispatcher.dispatchEvent(new IpcMessageEvent(message)));
    },
    toString: () => "ipcMessengerInWorkerModule"
};
