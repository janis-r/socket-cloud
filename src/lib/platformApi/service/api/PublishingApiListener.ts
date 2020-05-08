import {EventDispatcher, Injectable} from "quiver-framework";
import {HttpStatusCode} from "../../../httpServer/data/HttpStatusCode";
import {OutgoingMessageEvent} from "../../../defaultProtocol/event/OutgoingMessageEvent";
import {channelMessageUtil} from "../../../defaultProtocol/data/apiMessage/ChannelMessage";
import {individualMessageUtil} from "../../../defaultProtocol/data/apiMessage/IndividualMessage";
import {MessageType} from "../../../defaultProtocol/data/MessageType";
import {PushToClientMessage} from "../../../defaultProtocol/data/serverMessage/PushToClientMessage";
import {MessageManager} from "../../../defaultProtocol/service/MessageManager";
import {channelIdFromExternalId} from "../../../defaultProtocol/data/ChannelId";
import {RequestContext} from "../../../httpServer/data/RequestContext";
import {Router} from "../../../httpServer/data/Router";
import {PlatformApiHub} from "../PlatformApiHub";
import {PlatformApiRequestContext} from "../../data/PlatformApiRequestContext";

@Injectable()
export class PublishingApiListener {

    constructor(private readonly messageManager: MessageManager,
                private readonly eventDispatcher: EventDispatcher,
                apiHub: PlatformApiHub) {

        apiHub.registerSubRoutes(
            new Router()
                .post(`individual-message`, this.individualMessageHandler)
                .post(`channel-message`, this.channelMessageHandler)
                .post(`multi-channel-message`, this.multiChannelMessageHandler)
        )
    }

    private readonly individualMessageHandler = async ({sendJson, body, locals: {tokenInfo, apiCallId, logger}}: RequestContext<PlatformApiRequestContext>) => {
        const {messageManager, eventDispatcher} = this;
        const {BadRequest, MethodNotAllowed, PayloadTooLarge} = HttpStatusCode;

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

    private readonly channelMessageHandler = async ({sendJson, body, locals: {tokenInfo, apiCallId, logger}}: RequestContext<PlatformApiRequestContext>) => {
        const {BadRequest, MethodNotAllowed, PayloadTooLarge} = HttpStatusCode;
        const {messageManager, eventDispatcher} = this;

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

    private readonly multiChannelMessageHandler = async ({sendJson, body, locals: {tokenInfo, apiCallId, logger}}: RequestContext<PlatformApiRequestContext>) => {
        const {BadRequest, MethodNotAllowed, PayloadTooLarge} = HttpStatusCode;
        const {messageManager, eventDispatcher} = this;

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

}
