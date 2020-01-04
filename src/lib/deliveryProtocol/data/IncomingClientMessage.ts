import {RestoreRequest} from "./RestoreRequest";
import {PushMessage} from "./PushMessage";

export type IncomingClientMessage = PushMessage | RestoreRequest;

export const isIncomingData = (value: unknown): value is IncomingClientMessage => {
    return true;
};
