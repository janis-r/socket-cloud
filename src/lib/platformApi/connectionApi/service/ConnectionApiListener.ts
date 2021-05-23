import { EventDispatcher, Injectable } from "quiver-framework";
import { HttpStatusCode } from "../../../httpServer/data/HttpStatusCode";
import { MessageManager } from "../../../defaultProtocol/service/MessageManager";
import { RequestContext } from "../../../httpServer/data/RequestContext";
import { Router } from "../../../httpServer/data/Router";
import { PlatformApiHub } from "../../apiHub/service/PlatformApiHub";
import { PlatformApiRequestContext } from "../../apiHub/data/PlatformApiRequestContext";
import { ConnectionDataUtil } from "./ConnectionDataUtil";
import * as cluster from "cluster";

@Injectable()
export class ConnectionApiListener {

    constructor(private readonly messageManager: MessageManager,
        private readonly eventDispatcher: EventDispatcher,
        private readonly connectionDataUtil: ConnectionDataUtil,
        apiHub: PlatformApiHub) {

        apiHub.registerSubRoutes(
            new Router()
                .get(`connection/:connectionId`, this.getConnectionStatus)
                .delete(`connection/:connectionId`, this.deleteClientConnection)
        )
    }

    private readonly getConnectionStatus = async ({ param, sendJson, sendStatus, locals: { tokenInfo, logger } }: RequestContext<PlatformApiRequestContext>) => {
        const { connectionDataUtil } = this;
        const { MethodNotAllowed, NotFound } = HttpStatusCode;
        const { accessRights } = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights?.connection?.retrieveStatus) {
            const error = "Access rights to retrieve connection status are not granted";
            sendJson({ error }, { status: MethodNotAllowed });
            logger.log({ error }).commit();
            return;
        }

        const connectionId = param("connectionId").asString();
        const status = await connectionDataUtil.getConnectionStatus(connectionId);
        if (!status) {
            sendStatus(NotFound);
            logger.log(NotFound).commit();
        } else if (status) {
            sendJson(status);
            logger.log({ status }).commit();
        }
    };

    private readonly deleteClientConnection = async ({ param, sendJson, sendStatus, locals: { tokenInfo, logger } }: RequestContext<PlatformApiRequestContext>) => {
        const { connectionDataUtil } = this;
        const { Ok, MethodNotAllowed, NotFound } = HttpStatusCode;
        const { accessRights } = tokenInfo;

        // Check permissions
        if (accessRights !== "all" && !accessRights?.connection?.drop) {
            const error = "Access rights to drop connection are not granted";
            sendJson({ error }, { status: MethodNotAllowed });
            logger.log({ error }).commit();
            return;
        }

        const connectionId = param("connectionId").asString();
        if (await connectionDataUtil.dropClientConnection(connectionId)) {
            sendStatus(Ok);
            logger.log(Ok).commit();
        } else {
            sendStatus(NotFound);
            logger.log(NotFound).commit();
        }
    };

}
