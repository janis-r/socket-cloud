/**
 * Enumeration of ClientConnection close reasons.
 * Currently this is a subset of Websocket close codes although it doesn't have to stay that way in a future,
 * which is a reason this subset is brought to separate location outside websocket module.
 */
import { CloseCode } from "../../websocketConnection/data/CloseCode";

export class CloseReason {
    static readonly NormalClosure = CloseCode.NormalClosure;
    static readonly GoingAway = CloseCode.GoingAway;
    static readonly ProtocolError = CloseCode.ProtocolError;
    static readonly UnsupportedData = CloseCode.UnsupportedData;
    static readonly PolicyViolation = CloseCode.PolicyViolation;
    static readonly MessageTooBig = CloseCode.MessageTooBig;
    static readonly InternalServerError = CloseCode.InternalServerError;
}
