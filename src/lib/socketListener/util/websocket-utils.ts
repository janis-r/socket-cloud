import {WebSocketFrameParseError} from "../error/WebSocketFrameParseError";
import {WebsocketDataFrame} from "../data/WebsocketDataFrame";
import {WebsocketExtensionConfig} from "../data/WebsocketExtensionConfig";
import {createHash} from "crypto";

export const generateWebsocketHandshakeResponse = (key: string) => createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');

export function decomposeWebSocketFrame(buffer: Buffer): WebsocketDataFrame {
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
    let payloadLength: number | bigint = secondByte & 0x7F;
    if (payloadLength > 125) {
        if (payloadLength === 126) {
            payloadLength = buffer.readUInt16BE(payloadOffset);
            payloadOffset += 2;
        } else if (payloadLength === 127) {
            payloadOffset += 2;
            payloadLength = buffer.readBigInt64BE(payloadOffset);
            payloadOffset += 8;
        } else {
            throw new WebSocketFrameParseError(`Wrong data format - payload length of ${payloadLength} should not be there`);
        }
    }

    let maskingKey: number;
    const isMasked = !!((secondByte >>> 7) & 0x1);
    if (isMasked) {
        maskingKey = buffer.readUInt32BE(payloadOffset);
        payloadOffset += 4;
    }

    return (new class Foo implements WebsocketDataFrame {
        readonly header = {type, isFinal, maskingKey, payloadLength, payloadOffset, rsv1, rsv2, rsv3};
        private _payload: Buffer;
        get payload(): Buffer {
            if (!this._payload) {
                this._payload = extractMessagePayload(buffer, payloadOffset, payloadLength, maskingKey)
            }
            return this._payload;
        }
    });
}

function extractMessagePayload(buffer: Buffer, payloadOffset: number, payloadLength: number | bigint, maskingKey: number): Buffer {
    if (typeof payloadLength === "bigint") {
        throw new WebSocketFrameParseError("Bigint is yet to be introduced as message length param");
    }

    const data = Buffer.alloc(payloadLength);
    const maskBytes = [(maskingKey >> 24) & 0xFF, (maskingKey >> 16) & 0xFF, (maskingKey >> 8) & 0xFF, maskingKey & 0xFF];

    let offset = payloadOffset;
    for (let i = 0; i < payloadLength; i++) {
        data.writeUInt8(buffer.readUInt8(offset++) ^ maskBytes[i % 4], i);
    }
    return data;
}

/**
 * Parse sec-websocket-extensions header value into Map describing extensions and their params
 * @param headerString
 */
export function parseWebsocketExtensions(headerString: string): Map<string, Set<WebsocketExtensionConfig>> {
    const extensionMap = new Map<string, Set<WebsocketExtensionConfig>>();
    if (!headerString || !headerString.length) {
        return new Map();
    }

    headerString.split(/,\s*/g).map(entry => entry.split(/;\s*/g))
        .forEach(([extensionName, ...params]) => {
            const config: WebsocketExtensionConfig = new Map(params.map((param): [string, string | number | undefined] => {
                const [paramName, value] = param.split('=');
                return [
                    paramName,
                    value ? normalizeHeaderParamValue(value) : undefined
                ];
            }));

            if (extensionMap.has(extensionName)) {
                extensionMap.get(extensionName).add(config);
            } else {
                extensionMap.set(extensionName, new Set<WebsocketExtensionConfig>([config]));
            }
        });
    return extensionMap;
}

function normalizeHeaderParamValue(value: string): string | number {
    value = value.replace(/^\s*('|")|('|")\s*$/gm, ''); // According to docs this value can be quoted
    if (value.match(/^\d+$/)) {
        return parseInt(value);
    }
    return value;
}