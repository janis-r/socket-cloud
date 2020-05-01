import {EventDispatcher, Injectable} from "quiver-framework";
import {HttpRequestHandler} from "../../httpServer/data/HttpRequestHandler";
import {HttpServerRouter} from "../../httpServer/service/HttpServerRouter";
import {HttpStatusCode} from "../../httpServer/data/HttpStatusCode";
import {AccessTokenProvider} from "../../authorization/service/AccessTokenProvider";
import {TokenInfo} from "../../authorization/data/TokenInfo";
import {RequestContext} from "../../httpServer/data/RequestContext";
import {OutgoingMessageEvent} from "../event/OutgoingMessageEvent";
import {channelMessageUtil} from "../data/apiMessage/ChannelMessage";
import {individualMessageUtil} from "../data/apiMessage/IndividualMessage";
import {MessageType} from "../data/MessageType";
import {PushToClientMessage} from "../data/serverMessage/PushToClientMessage";
import {MessageManager} from "./MessageManager";
import {contextIdMatchRegexp} from "../../configurationContext/data/contextIdMatchRegexp";
import {PlatformApiCallManager} from "./PlatformApiCallManager";
import {ScopedLogger} from "../util/ScopedLogger";
import {channelIdFromExternalId} from "../data/ChannelId";
import {authTokenErrorResponseParams, authTokenHeaderName} from "../../authorization/data/auth-credentials";


@Injectable()
export class PlatformApiListener {
    static readonly servicePath = "api/platform";

    constructor(router: HttpServerRouter,
                private readonly tokenManager: AccessTokenProvider,
                private readonly messageManager: MessageManager,
                private readonly apiCallLogger: PlatformApiCallManager,
                private readonly eventDispatcher: EventDispatcher) {
        const {servicePath} = PlatformApiListener;
        router.post(`/${servicePath}/:contextId(${contextIdMatchRegexp})/individual-message/`, this.individualMessageHandler);
        router.post(`/${servicePath}/:contextId(${contextIdMatchRegexp})/channel-message/`, this.channelMessageHandler);
        router.post(`/${servicePath}/:contextId(${contextIdMatchRegexp})/multi-channel-message/`, this.multiChannelMessageHandler);
    }

    private readonly individualMessageHandler: HttpRequestHandler = async request => {
        const {BadRequest, MethodNotAllowed, PayloadTooLarge} = HttpStatusCode;
        const {messageManager, eventDispatcher} = this;

        const context = await this.getApiCallContext(request);
        if (!context) {
            return;
        }

        const {tokenInfo, apiCallId, logger} = context;
        const {sendJson, body} = request;
        const {context: {id: contextId, maxPayloadSize}, accessRights} = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights?.postIndividualMessages) {
            const error = "Action is not allowed";
            sendJson({error}, {status: MethodNotAllowed});
            logger.log({error}).commit();
            return;
        }

        // Check data format
        if (!individualMessageUtil.validate(body)) {
            sendJson(individualMessageUtil.lastError, {status: BadRequest});
            logger.log(individualMessageUtil.lastError).commit();
            return;
        }

        // Check payload
        const {payload, connectionIds} = body;
        if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(body.payload)) {
            const error = "Max payload exceeded";
            sendJson({error}, {status: PayloadTooLarge});
            logger.log({error}).commit();
            return;
        }

        const channels = connectionIds.map(channelIdFromExternalId);
        const message: PushToClientMessage = {
            type: MessageType.PushToClient,
            time: Date.now(),
            messageId: await messageManager.registerMessage(contextId, payload, {apiCallId}, channels),
            payload,
            channels
        };

        const event = new OutgoingMessageEvent(contextId, message);
        eventDispatcher.dispatchEvent(event);
        const recipients = await event.getRecipientCount();

        sendJson({recipients});
        logger.log({recipients}).commit();
    };

    private readonly channelMessageHandler: HttpRequestHandler = async request => {
        const {BadRequest, MethodNotAllowed, PayloadTooLarge} = HttpStatusCode;
        const {messageManager, eventDispatcher} = this;

        const context = await this.getApiCallContext(request);
        if (!context) {
            return;
        }

        const {tokenInfo, apiCallId, logger} = context;
        const {sendJson, body} = request;
        const {context: {id: contextId, maxPayloadSize}, accessRights} = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights.postChannelMessages) {
            const error = "Action is not allowed";
            sendJson({error}, {status: MethodNotAllowed});
            logger.log({error}).commit();
            return;
        }
        // Check data format
        if (!channelMessageUtil.validate(body)) {
            sendJson(channelMessageUtil.lastError, {status: BadRequest});
            logger.log(channelMessageUtil.lastError).commit();
            return;
        }

        const {payload, channels} = body;

        // Check payload
        if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(body.payload)) {
            const error = "Max payload exceeded";
            sendJson({error: "Max payload exceeded"}, {status: PayloadTooLarge});
            logger.log({error}).commit();
            return;
        }

        const message: PushToClientMessage = {
            type: MessageType.PushToClient,
            time: Date.now(),
            messageId: await messageManager.registerMessage(contextId, payload, {apiCallId}, channels),
            channels,
            payload
        };

        const event = new OutgoingMessageEvent(contextId, message);
        eventDispatcher.dispatchEvent(event);
        const recipients = await event.getRecipientCount();

        sendJson({recipients});
        logger.log({recipients}).commit();
    };

    private readonly multiChannelMessageHandler: HttpRequestHandler = async request => {
        const {BadRequest, MethodNotAllowed, PayloadTooLarge} = HttpStatusCode;
        const {messageManager, eventDispatcher} = this;

        const context = await this.getApiCallContext(request);
        if (!context) {
            return;
        }

        const {tokenInfo, apiCallId, logger} = context;
        const {sendJson, body} = request;
        const {context: {id: contextId, maxPayloadSize}, accessRights} = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights.postMultiChannelMessages) {
            const error = "Action is not allowed";
            sendJson({error}, {status: MethodNotAllowed});
            logger.log({error}).commit();
            return;
        }
        // Check data format
        if (!Array.isArray(body)) {
            const error = 'Message body should be an array';
            sendJson({error}, {status: BadRequest});
            logger.log({error}).commit();
            return;
        }
        for (const message of body) {
            if (!channelMessageUtil.validate(message)) {
                const error = `Some message is faulty: ${JSON.stringify(
                    {message, error: channelMessageUtil.lastError}
                )}`;
                sendJson({error}, {status: BadRequest});
                logger.log({error}).commit();
                return;
            }
            // Check payload
            if (maxPayloadSize && maxPayloadSize < Buffer.byteLength(message.payload)) {
                const error = `Max payload exceeded - message:${JSON.stringify(message)}`;
                sendJson({error}, {status: PayloadTooLarge});
                logger.log({error}).commit();
                return;
            }
        }

        let recipientDataPromises = new Set<Promise<number>>();
        for (const data of body) {
            if (!channelMessageUtil.validate(data)) {
                continue; // It's here only for typecasting
            }

            const {payload, channels} = data;
            const message: PushToClientMessage = {
                type: MessageType.PushToClient,
                time: Date.now(),
                messageId: await messageManager.registerMessage(contextId, payload, {apiCallId}, channels),
                channels,
                payload
            };

            const event = new OutgoingMessageEvent(contextId, message);
            eventDispatcher.dispatchEvent(event);
            recipientDataPromises.add(event.getRecipientCount());
        }

        const responses = await Promise.all([...recipientDataPromises]);
        const recipients = responses.reduce((prev, curr) => prev + curr);
        sendJson({recipients});
        logger.log({recipients}).commit();
    };

    private async getApiCallContext(request: RequestContext): Promise<{ apiCallId: number, tokenInfo: TokenInfo, logger: ScopedLogger } | null> {
        const {tokenManager: {validateToken}, apiCallLogger} = this;
        const {header, sendJson, headers, ipAddress, path, body} = request;

        const {id: apiCallId, logger} = await apiCallLogger.registerApiCall({headers, ipAddress, path, body});

        const accessToken = header(authTokenHeaderName);
        if (!accessToken) {
            const error = "API key is not set";
            sendJson({error}, authTokenErrorResponseParams);
            logger.log({error}).commit();
            return null;
        }

        const tokenInfo = await validateToken(accessToken);
        if (!tokenInfo) {
            const error = "API key, or its data context, is invalid";
            sendJson({error}, authTokenErrorResponseParams);
            logger.log({error}).commit();
            return null;
        }

        return {apiCallId, tokenInfo, logger};
    }
}
