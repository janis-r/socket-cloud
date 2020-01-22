import {PushToClientMessage, pushToClientUtil} from "./PushToClientMessage";
import {MessageType} from "../MessageType";

describe('PushToClientMessage', () => {
    it('Can serialize and deserialize', () => {
        const data: PushToClientMessage = {
            type: MessageType.PushToClient,
            messageId: "0",
            channels: ["/"],
            payload: "Hello!"
        };
        const serialized = pushToClientUtil.serialize(data);
        const deserialized = pushToClientUtil.deserialize(serialized);
        expect(deserialized).toMatchObject(data);
    });

    it('Can?', () => {
        const deserialized = pushToClientUtil.deserialize('{"type":3,"messageId":"0","payload":"cb967e4c","channels":["/"]}');
        console.log(deserialized);
        expect(deserialized).not.toBe(null);
    });
});
