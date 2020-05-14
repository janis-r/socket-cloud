import {Validator} from "ugd10a/validator";

export type ConnectionStatus = {
    connectionId: string,
    externalId?: string,
    uptime: number,
    bytesSent: number,
    bytesReceived: number,
}

export const connectionStatusValidator = new Validator<ConnectionStatus>({
    connectionId: {type: "string", notEmpty: true},
    externalId: {type: "string", optional: true, notEmpty: true},
    uptime: {type: "number"},
    bytesSent: {type: "number"},
    bytesReceived: {type: "number"},
})
