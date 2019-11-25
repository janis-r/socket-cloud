import * as zlib from "zlib";
import {PermessageDeflateConfig} from "../config/PermessageDeflateConfig";
import {WebsocketExtensionExecutor} from "../../websocketExtension";

export class PermessageDeflateExecutor implements WebsocketExtensionExecutor {

    constructor(readonly systemConfig: PermessageDeflateConfig,
                readonly connectionConfig: PermessageDeflateConfig) {
    }

    async transformIncomingData(payload: Buffer): Promise<Buffer> {
        // console.log('>> transform', Buffer);

        return new Promise<Buffer>((resolve, reject) => {
            // TODO: windowBits must be set from negotiated configuration
            const inflate = zlib.createInflateRaw({windowBits: 15});
            inflate.setEncoding("utf8");

            // inflate.on("error", err => console.log('>> err', err));
            // >> err Error: unexpected end of file
            // at Zlib.zlibOnError [as onerror] (zlib.js:170:17) {
            //     errno: -5,
            //         code: 'Z_BUF_ERROR'
            // }
            //TODO inflate.on("error") will throw error as described - have to deal with it.

            inflate.on("end", () => console.log('>> end'));
            inflate.on("data", chunk => {
                console.log('>> data', chunk.toString() + '||');
                resolve(chunk);
            });
            inflate.end(payload, () => console.log('inflate.end'));
        });
    }
}
