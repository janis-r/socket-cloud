import { Inject, MacroCommand, referenceToString, SubCommand } from "quiver-framework";
import { isPromise } from "ugd10a/validator";
import { WebsocketConnectionValidationRequest } from "../event/WebsocketConnectionValidationRequest";
import { Logger } from "../../logger/service/Logger";
import { AuthorizeConnectionContext } from "./microCommand/AuthorizeConnectionContext";
import { ValidateConnectionHeaders } from "./microCommand/ValidateConnectionHeaders";
import { WebsocketClientConnection } from "../model/WebsocketClientConnection";
import { PrepareWebsocketExtensions } from "./microCommand/PrepareWebsocketExtensions";
import { RespondToHandshake } from "./microCommand/RespondToHandshake";
import { ClientConnectionPool } from "../../clientConnectionPool/model/ClientConnectionPool";

export class ValidateNewWebsocket<T extends boolean> extends MacroCommand<T> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;
    @Inject()
    private readonly logger: Logger;
    @Inject()
    private readonly clientConnectionPool: ClientConnectionPool;

    constructor() {
        super(ValidateConnectionHeaders, AuthorizeConnectionContext, PrepareWebsocketExtensions, RespondToHandshake);
    }

    async execute(): Promise<void> {
        await super.execute();

        const {
            event: {
                request: { socket },
                requestInfo, configurationContext, extensions, socketDescriptor, operatorData
            },
            logger: { debug },
            clientConnectionPool
        } = this;

        if (this.executionIsHalted) {
            debug(`ValidateNewWebsocket halted with err`, requestInfo);
            return;
        }

        const connection = new WebsocketClientConnection(
            socket,
            configurationContext,
            extensions,
            socketDescriptor,
            operatorData,
        );

        clientConnectionPool.registerConnection(connection);
    }

    protected async executeSubCommand(command: SubCommand<T>): Promise<T> {
        const { logger: { console } } = this;
        const result = super.executeSubCommand(command);

        const value = isPromise(result) ? await result : result;
        console('>> done -> executeSubCommand', {
            command: referenceToString(command.type),
            value
        });

        if (value === false) {
            console('Halt ValidateNewWebsocket at', referenceToString(command.type));
            this.haltExecution();
        }
        return result;
    }

}