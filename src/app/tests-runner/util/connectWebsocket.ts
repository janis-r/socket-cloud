import * as http from "http";
import {IncomingMessage} from "http";
import * as https from "https";
import {Socket} from "net";
import * as crypto from "crypto";
import {handshakeResponse} from "../../../lib/websocketListener";
import {HttpStatusCode} from "../../../lib/httpServer";

export const connectWebsocket = async (url: string, version: 8 | 13 = 13) => new Promise<{ socket: Socket, authKey: string, version: number }>((resolve, reject) => {
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
    request.on("error", err => {
        reject(`Error while doing handshake: ${err.message}`);
    });
    request.on("timeout", () => {
        reject("websocket connection timeout");
    });
    request.on("response", ({statusCode, headers: {location}}: IncomingMessage): void => {
        if (location || statusCode !== HttpStatusCode.Ok) {
            reject(`redirect required or status is wrong: ${JSON.stringify({location, statusCode})}`)
        }
    });
    request.on("upgrade", ({headers: {'sec-websocket-accept': acceptHeader}}, socket) => {
        if (acceptHeader !== handshakeResponse(authKey)) {
            reject(`wrong handshake returned: ${JSON.stringify({acceptHeader, authKey})}`);
        } else {
            resolve({socket, authKey, version});
        }
    });
});
