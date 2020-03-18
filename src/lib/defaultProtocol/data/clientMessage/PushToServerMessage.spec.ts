import {MessageType} from "../MessageType";
import {PushToServerMessage, pushToServerUtil} from "./PushToServerMessage";

const {validate, serialize, deserialize} = pushToServerUtil;

describe('PushMessage', () => {
    it('Is validated properly', () => {
        expect(validate({type: MessageType.PushToServer, channels: "d12", payload: "payload"})).toBe(false);
        expect(validate({type: MessageType.PushToServer, channels: ["d12", "d13"], payload: "payload"})).toBe(true);
        expect(validate({type: "A", channels: "d12", payload: "payload"})).toBe(false);
        expect(validate({type: MessageType.PushToServer, channels: 12, payload: "payload"})).toBe(false);
        expect(validate({type: MessageType.PushToServer, channels: [12, 13], payload: "payload"})).toBe(false);
        expect(validate({type: MessageType.PushToServer, channels: "d12", payload: 1})).toBe(false);
    });

    it('Can be serialized and deserialized', () => {
        const m1: PushToServerMessage = {type: MessageType.PushToServer, channels: ["d12"], payload: "payload"};
        expect(deserialize(serialize(m1))).toMatchObject(m1);
        const m2: PushToServerMessage = {type: MessageType.PushToServer, channels: ["d12", "d13"], payload: "payload"};
        expect(deserialize(serialize(m2))).toMatchObject(m2);
        const m3: PushToServerMessage = {type: MessageType.PushToServer, channels: ["d12", "d12"], payload: "payload"};
        // Duplicated destinations like "d12", "d12" will be removed upon deserializing
        expect(deserialize(serialize(m3))).not.toMatchObject(m3);
        expect(deserialize(JSON.parse(serialize(m2)))).toMatchObject(m2);
    });

});
