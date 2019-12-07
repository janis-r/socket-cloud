import {websocketHandshakeResponse} from "./websocketHandshakeResponse";

describe("websocket handshake", () => {

    it("Can generate properly", () => {
        expect(
            websocketHandshakeResponse("dGhlIHNhbXBsZSBub25jZQ==")
        ).toBe(
            "s3pPLMBiTxaQ9kYGzzhZRbK+xOo="
        );
    });

});
