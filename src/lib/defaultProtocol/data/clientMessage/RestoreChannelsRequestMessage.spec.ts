import {RestoreChannelsRequestMessage, restoreRequestUtil} from "./RestoreChannelsRequestMessage";
import {MessageType} from "../MessageType";

describe('RestoreRequest', () => {
    it('Is validated properly', () => {
        expect(restoreRequestUtil.validate({
            type: MessageType.RestoreRequest,
            channels: [{channel: "restore-channels"}]
        })).toBe(true);
        expect(restoreRequestUtil.validate({
            type: MessageType.RestoreRequest,
            channels: [{
                channel: "restore-channels",
                filter: {
                    messageId: "mid"
                }
            }]
        })).toBe(true);
        expect(restoreRequestUtil.validate({
            type: MessageType.RestoreRequest,
            channels: [{
                channel: "restore-channels1",
                filter: {
                    messageId: "mid"
                }
            }, {
                channel: "restore-channels2",
                filter: {
                    messageId: "mid"
                }
            }, {
                channel: "restore-channels3",
                filter: {
                    messageId: "mid"
                }
            }]
        })).toBe(true);
        expect(restoreRequestUtil.validate({type: 'jiberish'} as any)).toBe(false);
        expect(restoreRequestUtil.validate({type: 'Restore'} as any)).toBe(false);
        expect(restoreRequestUtil.validate({type: MessageType.RestoreRequest} as any)).toBe(false);
        expect(restoreRequestUtil.validate({
            type: MessageType.RestoreRequest,
            channels: [{channel: "channels"}],
            unAllowedKey: 1
        } as any)).toBe(false);
        expect(restoreRequestUtil.validate({
            type: MessageType.RestoreRequest,
            channels: [{channel: "channels", unAllowedKey: 1}]
        } as any)).toBe(false);
    });

    it('Can serialize and deserialize simple message', () => {
        const data: RestoreChannelsRequestMessage = {
            type: MessageType.RestoreRequest,
            channels: [{channel: 'restore-channels'}]
        };
        expect(data).toMatchObject(restoreRequestUtil.deserialize(restoreRequestUtil.serialize(data)));
        expect(data).toMatchObject(restoreRequestUtil.deserialize(JSON.parse(restoreRequestUtil.serialize(data))));
    });
    it('Can serialize and deserialize complex message', () => {
        const data: RestoreChannelsRequestMessage = {
            type: MessageType.RestoreRequest,
            channels: [
                {channel: 'restore-channels1', filter: {messageId: "A"}},
                {channel: 'restore-channels2', filter: {messageId: "B"}},
                {channel: 'restore-channels3', filter: {messageId: "C"}},
                {channel: 'restore-channels4', filter: {messageId: "D"}},
                {channel: 'restore-channels5', filter: {messageId: "E"}},
            ]
        };
        expect(data).toMatchObject(restoreRequestUtil.deserialize(restoreRequestUtil.serialize(data)));
    });
});
