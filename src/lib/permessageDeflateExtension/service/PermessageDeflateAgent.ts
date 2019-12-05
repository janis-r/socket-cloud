import {WebsocketExtensionAgent} from "../../websocketExtension";
import {WebsocketDataFrame} from "../../socketListener/data/WebsocketDataFrame";
import {getDeflator, getInflator} from "../util/indeflate-utils";
import {WebsocketDataFrameType} from "../../socketListener/data/WebsocketDataFrameType";

export class PermessageDeflateAgent implements WebsocketExtensionAgent {

    private _inflate: ReturnType<typeof getInflator>;
    private _deflate: ReturnType<typeof getDeflator>;

    constructor(readonly config: AgentConfig,
                readonly configOfferResponse: string
    ) {
    }

    async transformIncomingData(dataFrames: Array<WebsocketDataFrame>) {
        if (!dataFrames[0].rsv1) {
            return dataFrames;
        }

        const transformedFrames = new Array<WebsocketDataFrame>();
        for (const {payload, ...ignoredParams} of dataFrames) {
            transformedFrames.push({...ignoredParams, rsv1: false, payload: await this.inflate(payload)});
        }
        return transformedFrames;
    }

    async transformOutgoingData(dataFrames: Array<WebsocketDataFrame>) {
        if (dataFrames[0].rsv1) {
            throw new Error(`Data frame collection is already deflated!`);
        }

        const transformedFrames = new Array<WebsocketDataFrame>();
        for (const {payload, ...ignoredParams} of dataFrames) {
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
