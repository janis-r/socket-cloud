import {MessageValidator} from "../../util/MessageValidator";
import {valueBelongsToEnum} from "ugd10a";

export type DataSyncMessage<T = any> = {
    type: DataSyncMessageType,
    data: T
}

export enum DataSyncMessageType {
    ForwardClientMessage,
    ClientMessageDeliveryReport
}

export const dataSyncMessageUtil = new MessageValidator<DataSyncMessage>([
    {field: "type", type: "number", validator: value => valueBelongsToEnum(DataSyncMessageType, value)},
    {field: "data", type: "object"}
]);
