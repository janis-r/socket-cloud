import * as crypto from "crypto";
import {createHash} from "crypto";
import {createDataFrame, WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";

/**
 * Generate Websocket connection handshake response
 * @param key
 */
export const generateWebsocketHandshakeResponse = (key: string) =>
    createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');

/**
 * Decompose binary representation of websocket data frame into value object
 * @param buffer
 */
export function decomposeWebSocketFrame(buffer: Buffer): Readonly<WebsocketDataFrame> {
    const firstByte = buffer.readUInt8(0);
    const [type, isFinal, rsv1, rsv2, rsv3] = [
        firstByte & 0xF,
        !!((firstByte >>> 7) & 0x1),
        !!((firstByte >>> 6) & 0x1),
        !!((firstByte >>> 5) & 0x1),
        !!((firstByte >>> 4) & 0x1)
    ];

    let payloadOffset = 2;

    const secondByte = buffer.readUInt8(1);
    let payloadLength: number = secondByte & 0x7F;

    if (payloadLength > 125) {
        if (payloadLength === 126) {
            payloadLength = buffer.readUInt16BE(payloadOffset);
            payloadOffset += 2;
        } else if (payloadLength === 127) {
            payloadOffset += 2;
            // payloadLength = buffer.readBigInt64BE(payloadOffset);
            payloadOffset += 8;
            throw new Error('64 bit payload length is not supported')
        } else {
            throw new Error(`Wrong data format - payload length of ${payloadLength} should not be there`);
        }
    }

    const isMasked = !!((secondByte >>> 7) & 0x1);
    let maskInt32: number;
    if (isMasked) {
        maskInt32 = buffer.readUInt32BE(payloadOffset);
        payloadOffset += 4;
    }

    const payload = buffer.slice(payloadOffset);
    /*const payload = Buffer.alloc(payloadLength);
    try {
        for (let i = 0; i < payloadLength; i++) {
            payload.writeUInt8(buffer.readUInt8(payloadOffset + i), i);
        }
    } catch (e) {
        const tempBuf = buffer.slice(payloadOffset);
        console.log(tempBuf.toString("utf8").slice(0, 20));
        console.log(tempBuf);
        console.log({
            payloadLength,
            'tempBuf.length': tempBuf.length,
            'buffer.length': buffer.length,
        });

        throw e;
    }*/

    if (payload.length !== payloadLength) {
        console.warn(`Payload length mismatch ${JSON.stringify({
            declaredLength: payloadLength,
            acquiredLength: payload.length,
            total: buffer.length,
            check: payloadOffset + payloadLength
        }, null, ' ')} @decomposeWebSocketFrame`);
    }

    if (maskInt32 && payload.length > 0) {
        const mask = [(maskInt32 >> 24) & 0xFF, (maskInt32 >> 16) & 0xFF, (maskInt32 >> 8) & 0xFF, maskInt32 & 0xFF];
        applyXorMask(payload, mask);
    }

    return {type, isFinal, rsv1, rsv2, rsv3, payload};
}

/**
 * Create binary representation of websocket data frame
 * @param dataFrame
 * @param masked
 */
export function composeWebsocketFrame(dataFrame: WebsocketDataFrame, masked: boolean = false): Buffer {
    const {type, payload, isFinal, rsv1, rsv2, rsv3} = dataFrame;

    const headerBytes = Buffer.alloc(2);
    // First byte consists of FIN and RSV(1-3) bits
    [isFinal, rsv1, rsv2, rsv3].forEach((value, index) => {
        if (value) {
            headerBytes[0] |= 0x1 << 7 - index;
        }
    });
    // Followed by opcode that take last 4 bits of first byte
    headerBytes[0] |= type;

    if (masked) {
        // First bit of second bytes indicate if this is masked data
        headerBytes[1] |= 0x1 << 7;
    }
    // Rest of second bytes is a payload length or marker of extended payload length type
    const {declaredPayloadValue, extendedPayloadSize} = calculatePayloadProps(payload.length);
    headerBytes[1] |= declaredPayloadValue;

    const extendedPayloadBytes = extendedPayloadSize ? Buffer.alloc(extendedPayloadSize) : null;
    if (extendedPayloadSize) {
        if (declaredPayloadValue === 126) {
            extendedPayloadBytes.writeUInt16BE(payload.length, 0);
        } else if (declaredPayloadValue === 127) {
            // TODO: What if payload length is actual 64 bit int?
            extendedPayloadBytes.writeUInt32BE(0, 0);
            extendedPayloadBytes.writeUInt32BE(payload.length, 4);
        }
    }

    const maskingKeyBytes = masked ? crypto.randomBytes(4) : null;
    const payloadBytes = payload.length > 0 ? payload : null;

    if (payloadBytes && masked) {
        applyXorMask(payloadBytes, [...maskingKeyBytes]);
    }

    return Buffer.concat([headerBytes, extendedPayloadBytes, maskingKeyBytes, payloadBytes].filter(e => !!e));
}

export function fragmentWebsocketFrame(type: WebsocketDataFrameType, payload: Buffer, fragmentSize: number): Array<WebsocketDataFrame> {
    if (!fragmentSize || payload.length <= fragmentSize) {
        return [
            createDataFrame(type, {payload})
        ];
    }

    const numFrames = Math.floor(payload.length / fragmentSize);
    const frames = new Array<WebsocketDataFrame>();
    for (let frameIndex = 0; frameIndex <= numFrames; frameIndex++) {
        const start = fragmentSize * frameIndex;
        const end = Math.min(start + fragmentSize, payload.length);
        frames.push(
            createDataFrame(
                frameIndex === 0 ? type : WebsocketDataFrameType.ContinuationFrame,
                {
                    payload: payload.slice(start, end),
                    isFinal: frameIndex == numFrames
                }
            )
        );
    }
    return frames;
}

const calculatePayloadProps = (length: number): { declaredPayloadValue: number, extendedPayloadSize: number } => {
    if (length >= 2 ** 16) {
        return {
            declaredPayloadValue: 127,
            extendedPayloadSize: 8
        };
    }
    if (length > 125) {
        return {
            declaredPayloadValue: 126,
            extendedPayloadSize: 2
        };
    }
    return {
        declaredPayloadValue: length,
        extendedPayloadSize: 0
    };
};

export function applyXorMask(buffer: Buffer, mask: number[]): Buffer {
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i % mask.length];
    }
    return buffer;
}
