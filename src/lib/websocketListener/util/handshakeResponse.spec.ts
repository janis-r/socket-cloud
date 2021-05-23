import { handshakeResponse } from "./handshakeResponse";

describe("websocket handshake", () => {

    it("Can generate properly", () => {
        expect(
            handshakeResponse("dGhlIHNhbXBsZSBub25jZQ==")
        ).toBe(
            "s3pPLMBiTxaQ9kYGzzhZRbK+xOo="
        );
    });

});
