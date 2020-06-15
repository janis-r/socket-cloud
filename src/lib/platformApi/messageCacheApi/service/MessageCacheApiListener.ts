import { Injectable } from "quiver-framework";
import { MessageManager } from "../../../defaultProtocol/service/MessageManager";
import { HttpStatusCode } from "../../../httpServer/data/HttpStatusCode";
import { RequestContext } from "../../../httpServer/data/RequestContext";
import { Router } from "../../../httpServer/data/Router";
import { PlatformApiRequestContext } from "../../apiHub/data/PlatformApiRequestContext";
import { PlatformApiHub } from "../../apiHub/service/PlatformApiHub";

@Injectable()
export class MessageCacheApiListener {

    constructor(private readonly messageManager: MessageManager, apiHub: PlatformApiHub) {

        apiHub.registerSubRoutes(
            new Router()
                .get(`message-cache/:channel`, this.getMessageCache)
                .delete(`message-cache/:channel`, this.clearMessageCache)
        )
    }

    private readonly getMessageCache = async ({ param, sendJson, sendStatus, locals: { tokenInfo, logger } }: RequestContext<PlatformApiRequestContext>) => {
        const { messageManager } = this;
        const { MethodNotAllowed, NotFound } = HttpStatusCode;
        const { accessRights, context: { id: contextId } } = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights?.messages?.requestChannelCacheStats) {
            const error = "Access rights to retrieve channel cache stats are not granted";
            sendJson({ error }, { status: MethodNotAllowed });
            logger.log({ error }).commit();
            return;
        }

        const channel = param("channel").asString();
        const messages = await messageManager.getCachedMessages(contextId, channel);
        if (!messages) {
            sendStatus(NotFound);
            logger.log(NotFound).commit();
        } else {
            const channelStats: { length: number, sizeInBytes: number } = {
                length: messages.length,
                sizeInBytes: messages.map(message => Buffer.byteLength(JSON.stringify(message))).reduce((curr, total) => curr + total)
            }
            sendJson(channelStats);
            logger.log({ channelStats }).commit();
        }
    };

    private readonly clearMessageCache = async ({ param, sendJson, sendStatus, locals: { tokenInfo, logger } }: RequestContext<PlatformApiRequestContext>) => {
        const { messageManager } = this;
        const { Ok, MethodNotAllowed, NotFound } = HttpStatusCode;
        const { accessRights, context: { id: contextId } } = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights?.messages?.clearChannelCache) {
            const error = "Rights to clear channel cache are not granted";
            sendJson({ error }, { status: MethodNotAllowed });
            logger.log({ error }).commit();
            return;
        }

        const channel = param("channel").asString();
        const messages = await messageManager.deleteChannelCache(contextId, channel);
        if (messages !== null) {
            sendJson({ messages });
            logger.log({ messages }).commit();
        } else {
            sendStatus(NotFound);
            logger.log(NotFound).commit();
        }
    };

}
