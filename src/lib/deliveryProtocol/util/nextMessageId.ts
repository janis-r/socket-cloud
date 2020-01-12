let messageId = 0;
export const nextMessageId = () => {
    const id = messageId++;
    if (messageId > 0xFFFFFF) {
        messageId = 0;
    }
    return id.toString();
};
