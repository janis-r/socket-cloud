import {createHash} from "crypto";

/**
 * Generate Websocket connection handshake response
 * @param key
 */
export const websocketHandshakeResponse = (key: string) =>
    createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');
