import {MessageType} from "./MessageType";
import {deserializePushMessage, isPushMessage, PushMessage, serializePushMessage} from "./PushMessage";

describe('PushMessage', () => {
    it('Is validated properly', () => {
        expect(isPushMessage({type: MessageType.Push, destination: "d12", payload: "payload"})).toBe(true);
        expect(isPushMessage({type: MessageType.Push, destination: ["d12", "d13"], payload: "payload"})).toBe(true);
        expect(isPushMessage({type: "A", destination: "d12", payload: "payload"})).toBe(false);
        expect(isPushMessage({type: MessageType.Push, destination: 12, payload: "payload"})).toBe(false);
        expect(isPushMessage({type: MessageType.Push, destination: [12, 13], payload: "payload"})).toBe(false);
        expect(isPushMessage({type: MessageType.Push, destination: "d12", payload: 1})).toBe(false);
    });

    it ('Can be serialized and deserialized', () => {
        const m1: PushMessage = {type: MessageType.Push, channels: ["d12"], payload: "payload"};
        expect(deserializePushMessage(serializePushMessage(m1))).toMatchObject(m1);
        const m2: PushMessage = {type: MessageType.Push, channels: ["d12", "d13"], payload: "payload"};
        expect(deserializePushMessage(serializePushMessage(m2))).toMatchObject(m2);
        const m3: PushMessage = {type: MessageType.Push, channels: ["d12", "d12"], payload: "payload"};
        // Duplicated destinations like "d12", "d12" will be removed upon deserializing
        expect(deserializePushMessage(serializePushMessage(m3))).not.toMatchObject(m3);
        expect(deserializePushMessage(JSON.parse(serializePushMessage(m2)))).toMatchObject(m2);
    });

});
