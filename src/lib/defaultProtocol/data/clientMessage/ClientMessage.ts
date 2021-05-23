import { valueBelongsToEnum } from "ugd10a";
import { RestoreChannelsRequestMessage, restoreRequestUtil } from "./RestoreChannelsRequestMessage";
import { PushToServerMessage, pushToServerUtil } from "./PushToServerMessage";
import { MessageType } from "../MessageType";
import { SubscribeMessage, subscribeMessageUtil } from "./SubscribeMessage";
import { UnsubscribeMessage, unsubscribeMessageUtil } from "./UnsubscribeMessage";

export type ClientMessage = PushToServerMessage | SubscribeMessage | UnsubscribeMessage | RestoreChannelsRequestMessage;

export const isClientMessage = (value: unknown): value is ClientMessage =>
    pushToServerUtil.validate(value) ||
    subscribeMessageUtil.validate(value) ||
    unsubscribeMessageUtil.validate(value) ||
    restoreRequestUtil.validate(value);

export const serializeClientMessage = (value: ClientMessage): string | null => {
    if (subscribeMessageUtil.validate(value)) {
        return subscribeMessageUtil.serialize(value);
    }
    if (unsubscribeMessageUtil.validate(value)) {
        return unsubscribeMessageUtil.serialize(value);
    }
    if (pushToServerUtil.validate(value)) {
        return pushToServerUtil.serialize(value);
    }
    if (restoreRequestUtil.validate(value)) {
        return restoreRequestUtil.serialize(value);
    }
    return null;
};

export const deserializeClientMessage = (value: string): ClientMessage | null => {
    let rawData: any[];
    try {
        rawData = JSON.parse(value);
    } catch (e) {
        console.log(`Error while deserialize IncomingClientMessage`, { value, e });
        return null;
    }
    if (!Array.isArray(rawData) || !rawData.length || !valueBelongsToEnum(MessageType, rawData[0])) {
        console.log({ value, rawData }, valueBelongsToEnum(MessageType, rawData[0]))
        console.log(!Array.isArray(rawData), !rawData.length, !valueBelongsToEnum(MessageType, rawData[0]))
        // process.exit()
        console.log(`Error while deserialize IncomingClientMessage 2 `, rawData);
        return null;
    }

    const type = <any>rawData[0] as MessageType;
    if (type === MessageType.Subscribe) {
        return subscribeMessageUtil.deserialize(rawData);
    }
    if (type === MessageType.Unsubscribe) {
        return unsubscribeMessageUtil.deserialize(rawData);
    }
    if (type === MessageType.PushToServer) {
        return pushToServerUtil.deserialize(rawData);
    }
    if (type === MessageType.RestoreRequest) {
        return restoreRequestUtil.deserialize(rawData);
    }
    return null;
};
