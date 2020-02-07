import {EventDispatcher, ModuleConfig} from "qft";
import {IpcMessenger} from "./service/IpcMessenger";
import {IpcMessageEvent} from "./event/IpcMessageEvent";
import {LoggerModule} from "../logger";

export const ipcMessengerInWorkerModule: ModuleConfig = {
    requires: [
        LoggerModule
    ],
    mappings: [
        {map: IpcMessenger, instantiate: true, useFactory: () => IpcMessenger.fromCurrentProcess()}
    ],
    setup: injector => {
        const eventDispatcher = injector.get(EventDispatcher);
        const messenger = injector.get(IpcMessenger);
        messenger.onMessage(message => eventDispatcher.dispatchEvent(new IpcMessageEvent(message)));
    },
    toString: () => "ipcMessengerInWorkerModule"
};
