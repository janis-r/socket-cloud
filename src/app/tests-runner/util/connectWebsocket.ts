import * as http from "http";
import {IncomingMessage} from "http";
import * as https from "https";
import {Socket} from "net";
import * as crypto from "crypto";
import {HttpStatusCode} from "../../../lib/types";
import {handshakeResponse} from "../../../lib/websocketListener";

export const connectWebsocket = async (url: string, version: 8 | 13 = 13) => new Promise<{ socket: Socket, authKey: string, version: number }>(resolve => {
    const authKey = crypto.randomBytes(16).toString("base64");
    const isSecure = !!url.match(/^https/i);
    const request = (isSecure ? https.get : http.get)(url, {
        headers: {
            'Sec-WebSocket-Version': version,
            'Sec-WebSocket-Key': authKey,
            Connection: 'Upgrade',
            Upgrade: 'websocket'
        }
    });
    request.on("timeout", () => {
        throw new Error("websocket connection timeout");
    });
    request.on("response", ({statusCode, headers: {location}}: IncomingMessage): void => {
        if (location || statusCode !== HttpStatusCode.Ok) {
            throw new Error(`redirect required or status is wrong: ${JSON.stringify({location, statusCode})}`)
        }
    });
    request.on("upgrade", ({headers: {'sec-websocket-accept': acceptHeader}}, socket) => {
        if (acceptHeader !== handshakeResponse(authKey)) {
            throw new Error(`wrong handshake returned: ${JSON.stringify({acceptHeader, authKey})}`);
        }
        resolve({socket, authKey, version});
    });
});
