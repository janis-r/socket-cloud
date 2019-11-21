export enum WebsocketDataFrameType {
    ContinuationFrame = 0,
    TextFrame = 1,
    BinaryFrame = 2,
    ConnectionClose = 8,
    Ping = 9,
    Pong = 10
}

export const frameTypeToString = (frameType: WebsocketDataFrameType): string | null => new Map<WebsocketDataFrameType, string>([
    [WebsocketDataFrameType.ContinuationFrame, "ContinuationFrame"],
    [WebsocketDataFrameType.TextFrame, "TextFrame"],
    [WebsocketDataFrameType.BinaryFrame, "BinaryFrame"],
    [WebsocketDataFrameType.ConnectionClose, "ConnectionClose"],
    [WebsocketDataFrameType.Ping, "Ping"],
    [WebsocketDataFrameType.Pong, "Pong"],
]).get(frameType) ?? null;
