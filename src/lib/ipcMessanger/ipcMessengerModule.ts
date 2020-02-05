import {ModuleConfig} from "qft";
import {IpcMessenger} from "./service/IpcMessenger";

export const ipcMessengerModule: ModuleConfig = {
    mappings: [
        {map: IpcMessenger, instantiate: true}
    ]
};
