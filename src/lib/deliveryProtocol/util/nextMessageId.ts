import * as cluster from "cluster";

const suffix = cluster?.worker?.id?.toString();

let messageId = 0;
export const nextMessageId = () => {
    const id = messageId++;
    if (messageId > 0xFFFFFF) {
        messageId = 0;
    }
    if (suffix) {
        return `${id}#${suffix}`;
    }
    return `${id}`;
};
