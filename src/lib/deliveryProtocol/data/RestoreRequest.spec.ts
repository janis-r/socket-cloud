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
        expect(isRestoreRequest({type: MessageType.Restore})).toBe(false);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            target: [{name: "target"}],
            unAllowedKey: 1
        } as any)).toBe(false);
        expect(isRestoreRequest({
            type: MessageType.Restore,
            target: [{
                name: "target",
                unAllowedKey: 1
            }]
        } as any)).toBe(false);
    });

    it('Can serialize and deserialize simple message', () => {
        const data: RestoreRequest = {
            type: MessageType.Restore,
            target: [{name: 'restore-target'}]
        };

        const serialized = serializeRestoreRequest(data);
        console.log({serialized});
        const deserialize = deserializeRestoreRequest(serialized);
        console.log(deserialize);
        expect(deserialize).toMatchObject(data);
    });
    it('Can serialize and deserialize complex message', () => {
        const data: RestoreRequest = {
            type: MessageType.Restore,
            target: [
                {name: 'restore-target1', lastKnownMessageId: "A"},
                {name: 'restore-target2', lastKnownMessageId: "B"},
                {name: 'restore-target3', lastKnownMessageId: "C"},
                {name: 'restore-target4', lastKnownMessageId: "D"},
                {name: 'restore-target5', lastKnownMessageId: "E"},
            ]
        };

        const serialized = serializeRestoreRequest(data);
        console.log({serialized});
        const deserialize = deserializeRestoreRequest(serialized);
        console.log(deserialize);
        expect(deserialize).toMatchObject(data);
    });
})
