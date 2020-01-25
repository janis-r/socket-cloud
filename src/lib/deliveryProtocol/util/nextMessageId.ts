import * as cluster from "cluster";

const suffix = cluster?.worker?.id?.toString();

let messageId = 0;
export const nextMessageId = () => {
    const id = messageId++;
    // TODO: Message id must include some worker specific component so message ids generated in different nodes do not collide
    // TODO: Message id could be provided by central service, so all ids on different nodes follow same sequence thus making em unique and usable for message ordering
    if (messageId > 0xFFFFFF) {
        messageId = 0;
    }
    if (suffix) {
        return `${id}#${suffix}`;
    }
    return `${id}`;
};
