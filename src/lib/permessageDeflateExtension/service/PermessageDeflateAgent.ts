import * as zlib from "zlib";
import {DeflateRaw, InflateRaw} from "zlib";
import {WebsocketExtensionAgent} from "../../websocketExtension";
import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";

export class PermessageDeflateAgent implements WebsocketExtensionAgent {

    private cachedInflate: InflateRaw;
    private cachedDeflate: DeflateRaw;

    constructor(readonly config: AgentConfig, readonly configOfferResponse: string) {
    }

    async transformIncomingData(dataFrame: WebsocketDataFrame): Promise<WebsocketDataFrame> {
        const {payload, rsv1, ...ignoredParams} = dataFrame;

        if (!rsv1) {
            return dataFrame;
        }

        return new Promise<WebsocketDataFrame>((resolve, reject) => {
            const inflate = this.getInflate();
            const chunks: Array<Buffer> = [];
            let length = 0;

            const errorHandler = err => reject(err);
            const dataHandler = chunk => {
                chunks.push(chunk);
                length += chunk.length;
            };

            inflate.on("error", errorHandler);
            inflate.on("data", dataHandler);

            inflate.write(payload);
            // inflate.write(Buffer.from([0x00, 0x00, 0xff, 0xff]));

            inflate.flush(() => {
                inflate.removeListener("error", errorHandler);
                inflate.removeListener("data", dataHandler);
                resolve({...ignoredParams, rsv1: false, payload: Buffer.concat(chunks, length)})
            });
        });
    }

    async transformOutgoingData(dataFrame: WebsocketDataFrame): Promise<WebsocketDataFrame> {
        const {ownWindowBits: windowBits} = this.config;
        const {payload, rsv1, ...ignoredParams} = dataFrame;
        if (rsv1) {
            throw new Error(`Cannot inflate message with rsv1 already set to 1 - ` + JSON.stringify(dataFrame));
        }
        return new Promise<WebsocketDataFrame>((resolve, reject) => {
            const deflate = this.getDeflate();

            const chunks: Array<Buffer> = [];
            let length = 0;

            const errorHandler = err => reject(err);
            const dataHandler = chunk => {
                chunks.push(chunk);
                length += chunk.length;
            };

            deflate.on("error", errorHandler);
            deflate.on("data", dataHandler);

            deflate.write(payload);
            deflate.flush(() => {
                deflate.removeListener("error", errorHandler);
                deflate.removeListener("data", dataHandler);

                let payload = Buffer.concat(chunks, length);
                payload = payload.slice(0, payload.length - 4);

                resolve({...ignoredParams, rsv1: true, payload});
            });
        });
    }

    private getInflate(): InflateRaw {
        const {allowPeerContextTakeover: allowTakeover, peerWindowBits: windowBits} = this.config;
        const createInstance = () => zlib.createInflateRaw({windowBits});
        if (!allowTakeover) {
            return createInstance();
        }

        if (!this.cachedInflate) {
            this.cachedInflate = createInstance();
        }

        return this.cachedInflate;
    }

    private getDeflate(): InflateRaw {
        const {allowOwnContextTakeover: allowTakeover, peerWindowBits: windowBits} = this.config;
        const createInstance = () => zlib.createDeflateRaw({windowBits});
        if (!allowTakeover) {
            return createInstance();
        }

        if (!this.cachedDeflate) {
            this.cachedDeflate = createInstance();
        }

        return this.cachedDeflate;
    }
}

type AgentConfig = {
    ownWindowBits: number,
    peerWindowBits: number,
    allowOwnContextTakeover: boolean,
    allowPeerContextTakeover: boolean
};
