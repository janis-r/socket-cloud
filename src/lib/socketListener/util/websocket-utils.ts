import * as crypto from "crypto";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketDataFrameType} from "../data/WebsocketDataFrameType";

/**
 * Decompose binary representation of websocket data frame into value object
 * @param buffer
 */
export function decomposeWebSocketFrame(buffer: Buffer): Readonly<WebsocketDataFrame> {
    let position: number = 0;
    const read = (bytes: number): Buffer => {
        if (buffer.length < position + bytes) {
            throw new Error(`Missing data in decomposeWebSocketFrame - trying to read ${bytes} bytes, while there's only ${buffer.length - position} available`);
        }
        const slice = buffer.slice(position, position + bytes);
        position += bytes;
        return slice;
    };

    const {type, isFinal, rsv1, rsv2, rsv3, payloadLength, masked} = decomposeHeader(read(2));

    let extendedPayloadLength: number;
    if (payloadLength === 126) {
        extendedPayloadLength = read(2).readUInt16BE(0);
    } else if (payloadLength === 127) {
        extendedPayloadLength = read64BitPayloadLength(read(8));
    }

    const maskBytes = masked ? getMaskBytes(read(4)) : null;
    const payload = read(extendedPayloadLength ?? payloadLength);
    maskBytes && applyXorMask(payload, maskBytes);
    return {type, isFinal, rsv1, rsv2, rsv3, payload, masked};
}

/**
 * Create binary representation of websocket data frame
 * @param dataFrame
 */
export function composeWebsocketFrame(dataFrame: WebsocketDataFrame): Buffer {
    const {type, payload, isFinal, rsv1, rsv2, rsv3, masked} = dataFrame;

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
        return [spawnFrameData(type, {payload})];
    }

    const numFrames = Math.floor(payload.length / fragmentSize);
    const frames = new Array<WebsocketDataFrame>();
    for (let frameIndex = 0; frameIndex <= numFrames; frameIndex++) {
        const start = fragmentSize * frameIndex;
        const end = Math.min(start + fragmentSize, payload.length);
        frames.push(
            spawnFrameData(
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

function calculatePayloadProps(length: number): { declaredPayloadValue: number, extendedPayloadSize: number } {
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
}

export function applyXorMask(buffer: Buffer, mask: number[]): Buffer {
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i % mask.length];
    }
    return buffer;
}

const emptyBuffer = Buffer.alloc(0);

export const spawnFrameData = (
    type: WebsocketDataFrameType, {
        payload = emptyBuffer,
        isFinal = true,
        rsv1 = false,
        rsv2 = false,
        rsv3 = false,
        masked = false
    }: Partial<Exclude<WebsocketDataFrame, "type">> = {}): WebsocketDataFrame & { render: () => Buffer } => {
    const dataFrame = {type, payload, isFinal, rsv1, rsv2, rsv3, masked};
    return {
        ...dataFrame,
        render: () => composeWebsocketFrame(dataFrame)
    };
};

export function decomposeHeader(data: Buffer): Pick<WebsocketDataFrame, "type" | "isFinal" | "rsv1" | "rsv2" | "rsv3"> & { payloadLength: number, masked: boolean } {
    const firstByte = data.readUInt8(0);
    const [type, isFinal, rsv1, rsv2, rsv3] = [
        firstByte & 0xF,
        !!((firstByte >>> 7) & 0x1),
        !!((firstByte >>> 6) & 0x1),
        !!((firstByte >>> 5) & 0x1),
        !!((firstByte >>> 4) & 0x1)
    ];
    const secondByte = data.readUInt8(1);
    const payloadLength = secondByte & 0x7F;
    const masked = !!((secondByte >>> 7) & 0x1);
    return {type, isFinal, rsv1, rsv2, rsv3, payloadLength, masked};
}

export function read64BitPayloadLength(data: Buffer): number {
    const leftPart = data.readUInt32BE(0);
    // Check if payload length is within bounds of Number in jS (bigint could actually help here?)
    if (leftPart > (2 ** 21) - 1) {
        throw new Error(`Payload length is too big`);
    }
    return leftPart * (2 ** 32) + data.readUInt32BE(4);
}

export function getMaskBytes(buffer: Buffer): Array<number> {
    const maskInt32 = buffer.readUInt32BE(0);
    return [(maskInt32 >> 24) & 0xFF, (maskInt32 >> 16) & 0xFF, (maskInt32 >> 8) & 0xFF, maskInt32 & 0xFF];
}

