/**
 * Endpoints MAY use the following pre-defined status codes when sending a Close frame.
 */
import {valueBelongsToEnum} from "ugd10a";

export enum CloseCode {

    /**
     * 1000 indicates a normal closure, meaning that the purpose for which the connection was
     * established has been fulfilled.
     */
    NormalClosure = 1000,

    /**
     * Indicates that an endpoint is "going away", such as a server going down or a browser
     * having navigated away from a page.
     */
    GoingAway = 1001,

    /**
     * Indicates that an endpoint is terminating the connection due to a protocol error.
     */
    ProtocolError = 1002,

    /**
     * Indicates that an endpoint is terminating the connection because it has received a type
     * of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if
     * it receives a binary message).
     */
    UnsupportedData = 1003,

    // 1004 Reserved. The specific meaning might be defined in the future.

    /**
     * 1005 is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint.
     * It is designated for use in applications expecting a status code to indicate that no status code was
     * actually present.
     */
    NoStatusRcvd = 1005,

    /**
     * 1006 is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint.
     * It is designated for use in applications expecting a status code to indicate that the connection was closed
     * abnormally, e.g., without sending or receiving a Close control frame.
     */
    AbnormalClosure = 1006,
    /**
     * Indicates that an endpoint is terminating the connection because it has received data within a
     * message that was not consistent with the type of the message (e.g., non-UTF-8 [RFC3629] data
     * within a text message).
     */
    InvalidFramePayloadData = 1007,

    /**
     * Indicates that an endpoint is terminating the connection because it has received a message that
     * violates its policy.  This is a generic status code that can be returned when there is no other more
     * suitable status code (e.g., 1003 or 1009) or if there  is a need to hide specific details about the policy.
     */
    PolicyViolation = 1008,

    /**
     * Indicates that an endpoint is terminating the connection because it has received a message that is too
     * big for it to process.
     */
    MessageTooBig = 1009,

    /**
     * Indicates that an endpoint (client) is terminating the connection because it has expected the server to
     * negotiate one or more extension, but the server didn't return them in the response message of the WebSocket
     * handshake.The list of extensions that are needed SHOULD appear in the /reason/ part of the Close frame.
     * Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
     */
    MandatoryExt = 1010,

    /**
     * 1011 indicates that a server is terminating the connection because it encountered an unexpected condition
     * that prevented it from fulfilling the request.
     */
    InternalServerError = 1011,

    /**
     * Is a reserved value and MUST NOT be set as a status code in a Close control frame by an endpoint.
     * It is designated for use in applications expecting a status code to indicate that the connection was
     * closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).
     */
    TLSHandshake = 1015
}

export const isValidWebsocketCloseCode = (value: number) =>
    valueBelongsToEnum(CloseCode, value) || value >= 3000 && value < 5000;

