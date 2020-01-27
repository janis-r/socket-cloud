import {MessageIdProvider} from "../MessageIdProvider";
import * as cluster from "cluster";

// TODO: Message id should be provided by central service, so all ids on different nodes follow same
//  sequence thus making em unique and usable for message ordering
export class InMemoryMessageIdProvider implements MessageIdProvider {

    private readonly suffix = cluster?.worker?.id?.toString();

    private messageId = 0;

    readonly nextMessageId = () => {
        const id = this.messageId++;
        if (this.messageId > 0xFFFFFFFF) {
            this.messageId = 0;
        }
        if (this.suffix) {
            return `${id}#${this.suffix}`;
        }
        return `${id}`;
    };

}
