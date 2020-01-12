import {deserializeRestoreRequest, isRestoreRequest, RestoreRequest, serializeRestoreRequest} from "./RestoreRequest";
import {MessageType} from "./MessageType";

describe('RestoreRequest', () => {
    it('Is validated properly', () => {
        expect(isRestoreRequest({type: MessageType.Restore, channels: [{channel: "restore-channels"}]})).toBe(true);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            channels: [{
                channel: "restore-channels",
                mid: "mid"
            }]
        })).toBe(true);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            channels: [{
                channel: "restore-channels1",
                mid: "mid"
            }, {
                channel: "restore-channels2",
                mid: "mid"
            }, {
                channel: "restore-channels3",
                mid: "mid"
            }]
        })).toBe(true);
        expect(isRestoreRequest({type: 'jiberish'} as any)).toBe(false);
        expect(isRestoreRequest({type: 'Restore'} as any)).toBe(false);
        expect(isRestoreRequest({type: MessageType.Restore} as any)).toBe(false);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            channels: [{channel: "channels"}],
            unAllowedKey: 1
        } as any)).toBe(false);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            channels: [{channel: "channels", unAllowedKey: 1}]
        } as any)).toBe(false);
    });

    it('Can serialize and deserialize simple message', () => {
        const data: RestoreRequest = {type: MessageType.Restore, channels: [{channel: 'restore-channels'}]};
        expect(data).toMatchObject(deserializeRestoreRequest(serializeRestoreRequest(data)));
        expect(data).toMatchObject(deserializeRestoreRequest(JSON.parse(serializeRestoreRequest(data))));
    });
    it('Can serialize and deserialize complex message', () => {
        const data: RestoreRequest = {
            type: MessageType.Restore,
            channels: [
                {channel: 'restore-channels1', mid: "A"},
                {channel: 'restore-channels2', mid: "B"},
                {channel: 'restore-channels3', mid: "C"},
                {channel: 'restore-channels4', mid: "D"},
                {channel: 'restore-channels5', mid: "E"},
            ]
        };
        expect(data).toMatchObject(deserializeRestoreRequest(serializeRestoreRequest(data)));
    });
});
