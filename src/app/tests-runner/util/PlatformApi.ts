import fetch from "node-fetch";
import {ExternalId} from "../../../lib/clientConnectionPool";
import {ContextId} from "../../../lib/configurationContext";
import {ChannelId} from "../../../lib/deliveryProtocol/data/ChannelId";
import {MessageValidator} from "../../../lib/deliveryProtocol/util/MessageValidator";
import {HttpStatusCode} from "../../../lib/httpServer";

export class PlatformApi {
    constructor(readonly serverUrl: string, readonly contextId: ContextId, readonly apiAccessKey: string) {
    }

    readonly individualMessage = async (payload: string, ...connectionIds: ExternalId[]): Promise<MessageDeliveryReport> => {
        const {serverUrl, contextId, apiAccessKey} = this;
        const request = await fetch(`${serverUrl}/${contextId}/individual-message`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-API-KEY": apiAccessKey
            },
            body: JSON.stringify({connectionIds, payload})
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();
            if (messageDeliveryReportUtil.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ${messageDeliveryReportUtil.lastValidationError}`);
        }

        throw new Error(`Platform API individual message request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    };

    readonly channelMessage = async (payload: string, ...channels: ChannelId[]): Promise<MessageDeliveryReport> => {
        const {serverUrl, contextId, apiAccessKey} = this;
        const request = await fetch(`${serverUrl}/${contextId}/channel-message`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-API-KEY": apiAccessKey
            },
            body: JSON.stringify({channels, payload})
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();
            if (messageDeliveryReportUtil.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ${messageDeliveryReportUtil.lastValidationError}`);
        }

        throw new Error(`Platform API channel message request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    };

    readonly multiChannelMessage = async (...messages: { payload: string, channels: ChannelId[] }[]): Promise<MessageDeliveryReport> => {
        const {serverUrl, contextId, apiAccessKey} = this;
        const request = await fetch(`${serverUrl}/${contextId}/multi-channel-message`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-API-KEY": apiAccessKey
            },
            body: JSON.stringify(messages)
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();
            if (messageDeliveryReportUtil.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ` + messageDeliveryReportUtil.lastValidationError);
        }

        throw new Error(`Platform API channel message request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    }

}


type MessageDeliveryReport = {
    recipients: number
}
export const messageDeliveryReportUtil = new MessageValidator<MessageDeliveryReport>([
    {field: "recipients", type: "number"}
]);
