import {RestoreChannelsResponseMessage, restoreResponseUtil} from "./RestoreChannelsResponseMessage";
import {MessageType} from "../MessageType";
import chalk from "chalk";

describe('RestoreChannelsResponseMessage', () => {
    it('Can be serialized and deserialized back', () => {
        const message: RestoreChannelsResponseMessage = {
            type: MessageType.RestoreResponse,
            payload: [
                {
                    channels: ["cached-channel"],
                    payload: "a",
                    messageId: "0"
                }, {
                    channels: ["cached-channel"],
                    payload: "c",
                    messageId: "2"
                }, {
                    channels: ["cached-channel"],
                    payload: "b",
                    messageId: "1"
                }, {
                    channels: ["cached-channel"],
                    payload: "d",
                    messageId: "3"
                }
            ]
        };
        expect(restoreResponseUtil.deserialize(restoreResponseUtil.serialize(message))).toMatchObject(message);
    });
});
