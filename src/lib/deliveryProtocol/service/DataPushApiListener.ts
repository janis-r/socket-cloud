import {EventDispatcher, Injectable} from "qft";
import {HttpRequestHandler, HttpServerRouter} from "../../httpServer";
import {AccessTokenManager} from "./AccessTokenManager";
import {RequestContext} from "../../httpServer/data/RequestContext";
import {TokenInfo} from "../data/TokenInfo";
import {ClientConnectionPool} from "../../clientConnectionPool";
import {HttpStatusCode} from "../../types/HttpStatusCode";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {channelMessageUtil} from "../data/apiMessage/ChannelMessage";
import {individualMessageUtil} from "../data/apiMessage/IndividualMessage";
import {MessageType} from "../data";
import {PushToClientMessage} from "../data/serverMessage/PushToClientMessage";
import {nextMessageId} from "../util/nextMessageId";

@Injectable()
export class DataPushApiListener {

    private readonly authTokenHeaderName = 'X-API-KEY';
    private readonly authTokenErrorResponseParams = {
        status: 401,
        headers: {
            WWW_Authenticate: "Basic"
        }
    };

    constructor(router: HttpServerRouter,
                private readonly tokenManager: AccessTokenManager,
                private readonly connectionPool: ClientConnectionPool,
                private readonly eventDispatcher: EventDispatcher) {

        router.post("individual-message", this.individualMessageHandler);
        router.post("channel-message", this.channelMessageHandler);
        router.post("multi-channel-message", this.multiChannelMessageHandler);
    }

    private readonly individualMessageHandler: HttpRequestHandler = async request => {
        const {connectionPool: {getConnectionsByContextAndExternalId}, eventDispatcher} = this;
        const config = await this.validateApiCall(request);
        if (!config) {
            return;
        }

        const {sendJson, body} = request;
        const {context: {id: contextId, maxPayloadSize}, accessRights} = config;

        // Check permissions
        if (accessRights !== "all" && !accessRights.postIndividualMessages) {
            sendJson({error: "Action is not allowed"}, {status: HttpStatusCode.MethodNotAllowed});
            return;
        }
        // Check data format
        if (!individualMessageUtil.validate(body)) {
            sendJson(individualMessageUtil.lastValidationError, {status: HttpStatusCode.BadRequest});
            return;
        }

        const {payload, connectionIds} = body;

        // Check payload
        if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(body.payload)) {
            sendJson({error: "Max payload exceeded"}, {status: HttpStatusCode.PayloadTooLarge});
            return;
        }

        const message: PushToClientMessage = {
            type: MessageType.PushToClient,
            messageId: nextMessageId(),
            channels: [],
            payload
        };

        const event = new OutgoingMessageEvent(contextId, message, connectionIds);
        eventDispatcher.dispatchEvent(event);
        const recipients = await event.getRecipientCount();
        // TODO: log message to message cache
        sendJson({recipients});
    };

    private readonly channelMessageHandler: HttpRequestHandler = async request => {
        const {eventDispatcher} = this;
        const config = await this.validateApiCall(request);
        if (!config) {
            return;
        }

        const {sendJson, body} = request;
        const {context: {id: contextId, maxPayloadSize}, accessRights} = config;

        // Check permissions
        if (accessRights !== "all" && !accessRights.postChannelMessages) {
            sendJson({error: "Action is not allowed"}, {status: HttpStatusCode.MethodNotAllowed});
            return;
        }
        // Check data format
        if (!channelMessageUtil.validate(body)) {
            sendJson(channelMessageUtil.lastValidationError(), {status: HttpStatusCode.BadRequest});
            return;
        }

        const {payload, channels} = body;

        // Check payload
        if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(body.payload)) {
            sendJson({error: "Max payload exceeded"}, {status: HttpStatusCode.PayloadTooLarge});
            return;
        }

        const message: PushToClientMessage = {
            type: MessageType.PushToClient,
            messageId: nextMessageId(),
            channels,
            payload
        };
        const event = new OutgoingMessageEvent(contextId, message);
        eventDispatcher.dispatchEvent(event);
        const recipients = await event.getRecipientCount();
        // TODO: log message to message cache
        sendJson({recipients});
    };

    private readonly multiChannelMessageHandler: HttpRequestHandler = async request => {
        const {eventDispatcher} = this;
        const config = await this.validateApiCall(request);
        if (!config) {
            return;
        }

        const {sendJson, body} = request;
        const {context: {id: contextId, maxPayloadSize}, accessRights} = config;

        // Check permissions
        if (accessRights !== "all" && !accessRights.postMultiChannelMessages) {
            sendJson({error: "Action is not allowed"}, {status: HttpStatusCode.MethodNotAllowed});
            return;
        }
        // Check data format
        if (!Array.isArray(body)) {
            sendJson('Message body should be an array', {status: HttpStatusCode.BadRequest});
            return;
        }
        for (const message of body) {
            if (!channelMessageUtil.validate(message)) {
                sendJson(`Some message is faulty: ${JSON.stringify(
                    {message, error: channelMessageUtil.lastValidationError}
                )}`, {status: HttpStatusCode.BadRequest});
                return;
            }
            // Check payload
            if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(message.payload)) {
                sendJson({error: `Max payload exceeded - message:${JSON.stringify(message)}`}, {status: HttpStatusCode.PayloadTooLarge});
                return;
            }
        }

        let recipients = 0;
        let recipientDataPromises = new Set<Promise<number>>();
        for (const data of body) {
            if (!channelMessageUtil.validate(data)) {
                continue; // It's here only for typecasting
            }

            const {payload, channels} = data;
            const message: PushToClientMessage = {
                type: MessageType.PushToClient,
                messageId: nextMessageId(),
                channels,
                payload
            };
            const event = new OutgoingMessageEvent(contextId, message);
            eventDispatcher.dispatchEvent(event);
            const promise = event.getRecipientCount();
            promise.then(value => recipients += value);
            recipientDataPromises.add(promise);
        }
        // TODO: log message to message cache
        await Promise.all([...recipientDataPromises]);
        sendJson({recipients});
    };

    private async validateApiCall(request: RequestContext): Promise<TokenInfo | null> {
        const {authTokenHeaderName, authTokenErrorResponseParams, tokenManager: {validateToken}} = this;
        const {header, sendJson} = request;

        const accessToken = header(authTokenHeaderName);
        if (!accessToken) {
            sendJson({error: "API key is not set"}, authTokenErrorResponseParams);
            return null;
        }

        const tokenInfo = await validateToken(accessToken);
        if (!tokenInfo) {
            sendJson({error: "API key, or its data context, is invalid"}, authTokenErrorResponseParams);
            return null;
        }

        return tokenInfo;
    }
}