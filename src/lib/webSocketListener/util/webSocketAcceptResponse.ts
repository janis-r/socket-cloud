const crypto = require('crypto');
export const webSocketAcceptResponse = (socketId: string) =>
    crypto.createHash('sha1')
        .update(socketId + '258EAFA5-E914–47DA-95CA-C5AB0DC85B11', 'binary')
        .digest('base64');
