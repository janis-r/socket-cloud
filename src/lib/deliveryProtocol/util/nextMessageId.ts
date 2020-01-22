import * as cluster from "cluster";

const suffix = cluster?.worker?.id?.toString();

let messageId = 0;
export const nextMessageId = () => {
    const id = messageId++;
    // TODO: Mesage id must include some worker specific component so message ids generated in different nodes do not collide
    if (messageId > 0xFFFFFF) {
        messageId = 0;
    }
    if (suffix) {
        return `${id}#${suffix}`;
    }
    return `${id}`;
};
