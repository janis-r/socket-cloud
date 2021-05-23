import { PushToClientMessage, pushToClientUtil } from "./PushToClientMessage";
import { MessageType } from "../MessageType";

describe('PushToClientMessage', () => {
    it('Can serialize and deserialize', () => {
        const data: PushToClientMessage = {
            type: MessageType.PushToClient,
            time: Date.now(),
            messageId: "0",
            channels: ["/"],
            payload: "Hello!"
        };
        const serialized = pushToClientUtil.serialize(data);
        const deserialized = pushToClientUtil.deserialize(serialized);
        expect(deserialized).toMatchObject(data);
    });

    it('Can serialize and deserialize message with empty channels', () => {
        const data: PushToClientMessage = {
            type: MessageType.PushToClient,
            time: Date.now(),
            messageId: "0",
            payload: "Hello!"
        };
        const serialized = pushToClientUtil.serialize(data);
        const deserialized = pushToClientUtil.deserialize(serialized);
        expect(deserialized).toMatchObject(data);
    });

});
