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
                    time: Date.now() - 10,
                    messageId: "0"
                }, {
                    channels: ["cached-channel"],
                    payload: "c",
                    time: Date.now() - 20,
                    messageId: "2"
                }, {
                    channels: ["cached-channel"],
                    payload: "b",
                    time: Date.now() - 30,
                    messageId: "1"
                }, {
                    channels: ["cached-channel"],
                    payload: "d",
                    time: Date.now() - 40,
                    messageId: "3"
                }
            ]
        };
        expect(restoreResponseUtil.deserialize(restoreResponseUtil.serialize(message))).toMatchObject(message);
    });
});
