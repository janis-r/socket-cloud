import {deserializeRestoreRequest, isRestoreRequest, RestoreRequest, serializeRestoreRequest} from "./RestoreRequest";
import {MessageType} from "./MessageType";

describe('RestoreRequest', () => {
    it('Is validated properly', () => {
        expect(isRestoreRequest({type: MessageType.Restore, target: [{name: "restore-target"}]})).toBe(true);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            target: [{
                name: "restore-target",
                lastKnownMessageId: "lastKnownMessageId"
            }]
        })).toBe(true);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            target: [{
                name: "restore-target1",
                lastKnownMessageId: "lastKnownMessageId"
            }, {
                name: "restore-target2",
                lastKnownMessageId: "lastKnownMessageId"
            }, {
                name: "restore-target3",
                lastKnownMessageId: "lastKnownMessageId"
            }]
        })).toBe(true);
        expect(isRestoreRequest({type: 'jiberish'} as any)).toBe(false);
        expect(isRestoreRequest({type: 'Restore'} as any)).toBe(false);
        expect(isRestoreRequest({type: MessageType.Restore} as any)).toBe(false);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            target: [{name: "target"}],
            unAllowedKey: 1
        } as any)).toBe(false);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            target: [{name: "target", unAllowedKey: 1}]
        } as any)).toBe(false);
    });

    it('Can serialize and deserialize simple message', () => {
        const data: RestoreRequest = {type: MessageType.Restore, channels: [{channel: 'restore-target'}]};
        expect(data).toMatchObject(deserializeRestoreRequest(serializeRestoreRequest(data)));
        expect(data).toMatchObject(deserializeRestoreRequest(JSON.parse(serializeRestoreRequest(data))));
    });
    it('Can serialize and deserialize complex message', () => {
        const data: RestoreRequest = {
            type: MessageType.Restore,
            channels: [
                {channel: 'restore-target1', mid: "A"},
                {channel: 'restore-target2', mid: "B"},
                {channel: 'restore-target3', mid: "C"},
                {channel: 'restore-target4', mid: "D"},
                {channel: 'restore-target5', mid: "E"},
            ]
        };
        expect(data).toMatchObject(deserializeRestoreRequest(serializeRestoreRequest(data)));
    });
});
