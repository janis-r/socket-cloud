import { WebsocketExtensionAgent } from "../../websocketExtension/service/WebsocketExtensionAgent";
import { getDeflator, getInflator } from "../util/indeflate-utils";
import { DataFrame } from "../../websocketConnection/data/DataFrame";
import { DataFrameType } from "../../websocketConnection/data/DataFrameType";

const { TextFrame, BinaryFrame } = DataFrameType;

export class PermessageDeflateAgent implements WebsocketExtensionAgent {

    private _inflate: ReturnType<typeof getInflator>;
    private _deflate: ReturnType<typeof getDeflator>;

    constructor(
        readonly config: AgentConfig,
        readonly configOfferResponse: string
    ) {
    }

    async incomingDataPipe(dataFrame: DataFrame) {
        const { type, rsv1, payload } = dataFrame;
        if (![TextFrame, BinaryFrame].includes(type) || !rsv1) {
            return dataFrame;
        }

        return {
            ...dataFrame,
            rsv1: false,
            payload: await this.inflate(payload)
        }
    }

    async outgoingDataPipe(dataFrame: DataFrame) {
        const { type, rsv1, payload } = dataFrame;
        if (![TextFrame, BinaryFrame].includes(type)) {
            return dataFrame;
        }
        if (rsv1) {
            throw new Error(`Data frame collection is already deflated!`);
        }

        return {
            ...dataFrame,
            rsv1: true,
            payload: await this.deflate(payload)
        };
    }

    private get inflate() {
        if (this._inflate) {
            return this._inflate;
        }

        const { allowPeerContextTakeover: allowTakeover, peerWindowBits: windowBits } = this.config;
        const executor = getInflator({ windowBits });
        if (allowTakeover) {
            this._inflate = executor;
        }
        return executor;
    }

    private get deflate() {
        if (this._deflate) {
            return this._deflate;
        }

        const { allowOwnContextTakeover: allowTakeover, ownWindowBits: windowBits } = this.config;
        const executor = getDeflator({ windowBits });

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
