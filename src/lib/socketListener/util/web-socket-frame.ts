export function parseMessage(buffer: Buffer): Readonly<{ header: WebSocketHeader, getPayload?: () => Buffer }> {
    const firstByte = buffer.readUInt8(0);

    const type = firstByte & 0xF;
    if (type !== FrameType.TextFrame) {
        return {
            header: {type}
        };
    }

    const isFinal = !!((firstByte >>> 7) & 0x1);
    const compressed = (firstByte & 0x40) === 0x40;

    let payloadOffset = 2;

    const secondByte = buffer.readUInt8(1);
    let payloadLength = secondByte & 0x7F;
    if (payloadLength > 125) {
        if (payloadLength === 126) {
            payloadLength = buffer.readUInt16BE(payloadOffset);
            payloadOffset += 2;
        } else if (payloadLength === 127) {
            throw new Error('Large payloads not currently implemented');
        } else {
            throw new Error(`Wrong data format - payload length of ${payloadLength} should not be there`);
        }
    }

    let maskingKey: number;
    const isMasked = !!((secondByte >>> 7) & 0x1);
    if (isMasked) {
        maskingKey = buffer.readUInt32BE(payloadOffset);
        payloadOffset += 4;
    }

    return {
        header: {type, isFinal, maskingKey, payloadLength, payloadOffset, compressed},
        getPayload: () => extractMessagePayload(buffer, payloadOffset, payloadLength, maskingKey)
    };
}

function extractMessagePayload(buffer: Buffer, payloadOffset, payloadLength, maskingKey): Buffer {
    const data = Buffer.alloc(payloadLength);
    const maskBytes = [
        (maskingKey >> 24) & 0xFF,
        (maskingKey >> 16) & 0xFF,
        (maskingKey >> 8) & 0xFF,
        maskingKey & 0xFF,
    ];

    let offset = payloadOffset;
    for (let i = 0; i < payloadLength; i++) {
        data.writeUInt8(buffer.readUInt8(offset++) ^ maskBytes[i % 4], i);
    }
    return data;
}

export enum FrameType {
    // %x0 denotes a continuation frame
    ContinuationFrame = 0x0,
    // %x1 denotes a text frame
    TextFrame = 0x1,
    // %x2 denotes a binary frame
    BinaryFrame = 0x2,
    // %x8 denotes a connection close
    ConnectionClose = 0x8,
    // %x9 denotes a ping
    Ping = 0x9,
    // %xA denotes a pong
    Pong = 0xA
}

export type WebSocketHeader = {
    type: FrameType,
    isFinal?: boolean,
    maskingKey?: number,
    payloadLength?: number,
    payloadOffset?: number,
    compressed?: boolean,
};
