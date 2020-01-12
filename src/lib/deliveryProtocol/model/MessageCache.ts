import {ContextId} from "../../configurationContext";
import {ChannelId} from "../data/ChannelId";
import {OutgoingMessage} from "../data";

export class MessageCache {


    write(context: ContextId, message: Pick<OutgoingMessage, "channels" | "payload">): void {

    }
}

type CachedMessage = {
    message: OutgoingMessage,
    time: number
};
