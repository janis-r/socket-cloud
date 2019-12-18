export enum DataFrameType {
    ContinuationFrame = 0,
    TextFrame = 1,
    BinaryFrame = 2,
    ConnectionClose = 8,
    Ping = 9,
    Pong = 10
}

const frameTypeToStringMapping = new Map<DataFrameType, string>([
    [DataFrameType.ContinuationFrame, "ContinuationFrame"],
    [DataFrameType.TextFrame, "TextFrame"],
    [DataFrameType.BinaryFrame, "BinaryFrame"],
    [DataFrameType.ConnectionClose, "ConnectionClose"],
    [DataFrameType.Ping, "Ping"],
    [DataFrameType.Pong, "Pong"],
]);

export const frameTypeToString = (frameType: DataFrameType): string | null => frameTypeToStringMapping.get(frameType) ?? null;
