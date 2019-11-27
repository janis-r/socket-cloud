import * as zlib from "zlib";
import {PermessageDeflateConfig} from "../config/PermessageDeflateConfig";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {PermessageDeflateExtensionConfig} from "../data/PermessageDeflateExtensionConfig";
import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";

export class PermessageDeflateAgent implements WebsocketExtensionAgent {

    constructor(readonly systemConfig: PermessageDeflateConfig,
                readonly config: PermessageDeflateExtensionConfig) {
    }

    async transformIncomingData(dataFrame: WebsocketDataFrame): Promise<WebsocketDataFrame> {
        const {payload, rsv1, ...ignoredParams} = dataFrame;

        if (!rsv1) {
            return dataFrame;
        }

        return new Promise<WebsocketDataFrame>((resolve, reject) => {
            // TODO: windowBits must be set from negotiated configuration
            const inflate = zlib.createInflateRaw({windowBits: 15});

            const chunks = [];
            let length = 0;

            inflate.on("error", err => reject(err));
            inflate.on("data", chunk => {
                chunks.push(chunk);
                length += chunk.length;
            });

            inflate.write(payload);
            inflate.write(Buffer.from([0x00, 0x00, 0xff, 0xff]));

            inflate.flush(() => resolve({...ignoredParams, rsv1: false, payload: Buffer.concat(chunks, length)}));
        });
    }

    async transformOutgoingData(dataFrame: WebsocketDataFrame): Promise<WebsocketDataFrame> {
        const {payload, rsv1, ...ignoredParams} = dataFrame;
        if (rsv1) {
            throw new Error(`Cannot inflate message with rsv1 already set to 1 - ` + JSON.stringify(dataFrame));
        }
        return new Promise<WebsocketDataFrame>((resolve, reject) => {
            // TODO: windowBits must be set from negotiated configuration
            const deflate = zlib.createDeflateRaw({windowBits: 15});

            const chunks = [];
            let length = 0;

            deflate.on("error", err => reject(err));
            deflate.on("data", chunk => {
                chunks.push(chunk);
                length += chunk.length;
            });

            deflate.write(payload);
            deflate.flush(() => {
                let payload = Buffer.concat(chunks, length);
                payload = payload.slice(0, payload.length - 4);
                resolve({...ignoredParams, rsv1: true, payload});
            });
        });
    }
}
