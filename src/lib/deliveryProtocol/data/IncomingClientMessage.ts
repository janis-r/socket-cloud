import {deserializeRestoreRequest, isRestoreRequest, RestoreRequest, serializeRestoreRequest} from "./RestoreRequest";
import {deserializePushMessage, isPushMessage, PushMessage, serializePushMessage} from "./PushMessage";
import {valueBelongsToEnum} from "ugd10a";
import {MessageType} from "./MessageType";
import {
    deserializeSubscribeMessage,
    isSubscribeMessage,
    serializeSubscribeMessage,
    SubscribeMessage
} from "./SubscribeMessage";
import {
    deserializeUnsubscribeMessage,
    isUnsubscribeMessage,
    serializeUnsubscribeMessage,
    UnsubscribeMessage
} from "./UnsubscribeMessage";

export type IncomingClientMessage = PushMessage | SubscribeMessage | UnsubscribeMessage | RestoreRequest;

export const isIncomingClientMessage = (value: unknown): value is IncomingClientMessage => isPushMessage(value) || isRestoreRequest(value);

export const serializeIncomingClientMessage = (value: IncomingClientMessage): string | null => {
    if (isSubscribeMessage(value)) {
        return serializeSubscribeMessage(value);
    }
    if (isUnsubscribeMessage(value)) {
        return serializeUnsubscribeMessage(value);
    }
    if (isPushMessage(value)) {
        return serializePushMessage(value);
    }
    if (isRestoreRequest(value)) {
        return serializeRestoreRequest(value);
    }
    return null;
};

export const deserializeIncomingClientMessage = (value: string): IncomingClientMessage | null => {
    let rawData: any[];
    try {
        rawData = JSON.parse(value);
    } catch (e) {
        console.log(`Error while deserialize IncomingClientMessage`, {value, e});
        return null;
    }

    if (!Array.isArray(rawData) || !rawData.length || !valueBelongsToEnum(MessageType, rawData[0])) {
        console.log(`Error while deserialize IncomingClientMessage 2 `, rawData);
        return null;
    }

    const type = <any>rawData[0] as MessageType;
    if (type === MessageType.Subscribe) {
        return deserializeSubscribeMessage(rawData);
    }
    if (type === MessageType.Unsubscribe) {
        return deserializeUnsubscribeMessage(rawData);
    }
    if (type === MessageType.Push) {
        return deserializePushMessage(rawData);
    }
    if (type === MessageType.Restore) {
        return deserializeRestoreRequest(rawData);
    }
    return null;
};
