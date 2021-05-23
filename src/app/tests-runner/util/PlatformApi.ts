import fetch from "node-fetch";
import {ExternalId} from "../../../lib/clientConnectionPool/data/ExternalId";
import {ChannelId} from "../../../lib/defaultProtocol/data/ChannelId";
import {MessageValidator} from "../../../lib/defaultProtocol/util/MessageValidator";
import {HttpStatusCode} from "../../../lib/httpServer/data/HttpStatusCode";
import {createHeaders} from "./test-utils";
import {ConnectionId} from "../../../lib/clientConnectionPool/data/ConnectionId";
import {
    ConnectionStatus,
    connectionStatusValidator
} from "../../../lib/platformApi/connectionApi/data/ConnectionStatus";

export class PlatformApi {
    constructor(readonly serviceUrl: string, readonly apiKey: string) {
    }

    readonly individualMessage = async (payload: string, ...connectionIds: ExternalId[]): Promise<MessageDeliveryReport> => {
        const {serviceUrl, apiKey} = this;
        const request = await fetch(`${serviceUrl}/individual-message`, {
            method: "POST",
            headers: createHeaders(apiKey, true),
            body: JSON.stringify({connectionIds, payload})
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();
            if (messageDeliveryReportUtil.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ${messageDeliveryReportUtil.lastError}`);
        }

        throw new Error(`Platform API individual message request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    };

    readonly channelMessage = async (payload: string, ...channels: ChannelId[]): Promise<MessageDeliveryReport> => {
        const {serviceUrl, apiKey} = this;
        const request = await fetch(`${serviceUrl}/channel-message`, {
            method: "POST",
            headers: createHeaders(apiKey, true),
            body: JSON.stringify({channels, payload})
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();
            if (messageDeliveryReportUtil.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ${messageDeliveryReportUtil.lastError}`);
        }

        throw new Error(`Platform API channel message request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    };

    readonly multiChannelMessage = async (...messages: { payload: string, channels: ChannelId[] }[]): Promise<MessageDeliveryReport> => {
        const {serviceUrl, apiKey} = this;
        const request = await fetch(`${serviceUrl}/multi-channel-message`, {
            method: "POST",
            headers: createHeaders(apiKey, true),
            body: JSON.stringify(messages)
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();
            if (messageDeliveryReportUtil.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ` + messageDeliveryReportUtil.lastError);
        }

        throw new Error(`Platform API channel message request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    }

    readonly getConnectionStatus = async (connectionId: ConnectionId): Promise<ConnectionStatus> => {
        const {serviceUrl, apiKey} = this;

        const request = await fetch(`${serviceUrl}/connection/${encodeURIComponent(connectionId)}`, {
            method: "GET",
            headers: createHeaders(apiKey, true)
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const data = await request.json();

            if (connectionStatusValidator.validate(data)) {
                return data;
            }
            throw new Error(`Invalid response: ` + connectionStatusValidator.lastError);
        }

        throw new Error(`Platform API connection status request produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    }

    readonly dropConnection = async (connectionId: ConnectionId): Promise<boolean> => {
        const {serviceUrl, apiKey} = this;

        const request = await fetch(`${serviceUrl}/connection/${encodeURIComponent(connectionId)}`, {
            method: "DELETE",
            headers: createHeaders(apiKey, true)
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            return true;
        }

        throw new Error(`Platform API drop connection request produced error: ${JSON.stringify({
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
