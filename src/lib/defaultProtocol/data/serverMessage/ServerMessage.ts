import {valueBelongsToEnum} from "ugd10a";
import {MessageType} from "../MessageType";
import {PushToClientMessage, pushToClientUtil} from "./PushToClientMessage";
import {RestoreChannelsResponseMessage, restoreResponseUtil} from "./RestoreChannelsResponseMessage";

export type ServerMessage = PushToClientMessage | RestoreChannelsResponseMessage;

export const isServerMessage = (value: unknown): value is ServerMessage =>
    pushToClientUtil.validate(value) ||
    restoreResponseUtil.validate(value);

export const serializeServerMessage = (value: ServerMessage): string | null => {
    if (pushToClientUtil.validate(value)) {
        return pushToClientUtil.serialize(value);
    }
    if (restoreResponseUtil.validate(value)) {
        return restoreResponseUtil.serialize(value);
    }
    return null;
};

export const deserializeServerMessage = (value: string): ServerMessage | null => {
    let rawData: any[];
    try {
        rawData = JSON.parse(value);
    } catch (e) {
        console.log(`Error while deserialize ServerMessage`, {value, e});  // TODO: Log to error log instead
        return null;
    }

    if (!Array.isArray(rawData) || !rawData.length || !valueBelongsToEnum(MessageType, rawData[0])) {
        console.log(`Error while deserialize ServerMessage 2 `, rawData); // TODO: Log to error log instead
        return null;
    }

    const type = <any>rawData[0] as MessageType;
    if (type === MessageType.PushToClient) {
        return pushToClientUtil.deserialize(rawData);
    }
    if (type === MessageType.RestoreResponse) {
        return restoreResponseUtil.deserialize(rawData);
    }
    return null;
};
