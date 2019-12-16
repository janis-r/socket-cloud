import {ZlibOptions} from "zlib";
import {getInflator} from "../util/indeflate-utils";
import {PermessageDeflateAgent} from "./PermessageDeflateAgent";

describe('PermessageDeflateAgent.spec', () => {

    it("Can inflate and then deflate binary data", async (doneCallback) => {

        const agent = new PermessageDeflateAgent({
            allowOwnContextTakeover: true,
            allowPeerContextTakeover: false,
            ownWindowBits: 15,
            peerWindowBits: 15
        }, "");

        const rawData = {
            type: 2,
            isFinal: true,
            rsv1: true,
            rsv2: false,
            rsv3: false,
            masked: false,
            payload: Buffer.from([
                0x02, 0x02, 0x26, 0x08, 0x66, 0x64, 0xe0, 0x00, 0x32, 0x00, 0x00
            ])
        };
        const data = await agent.transformIncomingData([rawData]);
        console.log(data);

        doneCallback();
    });

});
