import {WebsocketExtensionAgent} from "../../websocketExtension";
import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";
import {getDeflator, getInflator} from "../util/indeflate-utils";
import {WebsocketDataFrameType} from "../../socketListener/data/WebsocketDataFrameType";

const {ContinuationFrame, TextFrame, BinaryFrame} = WebsocketDataFrameType;

export class PermessageDeflateAgent implements WebsocketExtensionAgent {

    private _inflate: ReturnType<typeof getInflator>;
    private _deflate: ReturnType<typeof getDeflator>;

    constructor(readonly config: AgentConfig,
                readonly configOfferResponse: string
    ) {
    }

    async transformIncomingData(dataFrames: Array<WebsocketDataFrame>) {
        console.log('>> transformIncomingData', dataFrames);
        if (![ContinuationFrame, TextFrame, BinaryFrame].includes(dataFrames[0].type) || !dataFrames[0].rsv1) {
            return dataFrames;
        }

        const transformedFrames = new Array<WebsocketDataFrame>();
        for (const {payload, ...ignoredParams} of dataFrames) {
            // try {
                transformedFrames.push({...ignoredParams, rsv1: false, payload: await this.inflate(payload)});
            // } catch (e) {
            //     console.log('err', e);
            //     console.log('config', this.config);
            //     process.exit();
            // }
        }
        return transformedFrames;
    }

    async transformOutgoingData(dataFrames: Array<WebsocketDataFrame>) {
        console.log('>> transformOutgoingData', dataFrames);
        if (![ContinuationFrame, TextFrame, BinaryFrame].includes(dataFrames[0].type)) {
            return dataFrames;
        }
        if (dataFrames[0].rsv1) {
            throw new Error(`Data frame collection is already deflated!`);
        }

        const transformedFrames = new Array<WebsocketDataFrame>();
        for (const {payload, ...ignoredParams} of dataFrames) {
            console.log('>> payload', payload.toString("utf8"));
            transformedFrames.push({
                ...ignoredParams,
                rsv1: ignoredParams.type !== WebsocketDataFrameType.ContinuationFrame, // Only first, definitive frame has other type than ContinuationFrame
                payload: await this.deflate(payload)
            });
        }
        return transformedFrames;
    }

    private get inflate() {
        if (this._inflate) {
            return this._inflate;
        }

        const {allowPeerContextTakeover: allowTakeover, peerWindowBits: windowBits} = this.config;
        const executor = getInflator({windowBits});
        if (allowTakeover) {
            this._inflate = executor;
        }
        return executor;
    }

    private get deflate() {
        if (this._deflate) {
            return this._deflate;
        }

        const {allowOwnContextTakeover: allowTakeover, peerWindowBits: windowBits} = this.config;
        const executor = getDeflator({windowBits});

        if (allowTakeover) {
            return this._deflate = executor;
        }

        return executor;
    }
}

type AgentConfig = {
    ownWindowBits: number,
    peerWindowBits: number,
    allowOwnContextTakeover: boolean,
    allowPeerContextTakeover: boolean
};
