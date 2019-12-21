import {Inject, MacroCommand, referenceToString, SubCommand} from "qft";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../logger";
import {AuthorizeConnectionContext} from "./microCommand/AuthorizeConnectionContext";
import {ValidateConnectionHeaders} from "./microCommand/ValidateConnectionHeaders";
import {WebsocketClientConnection} from "../model/WebsocketClientConnection";
import {PrepareWebsocketExtensions} from "./microCommand/PrepareWebsocketExtensions";
import {isPromise} from "../../utils/is-promise";
import {RespondToHandshake} from "./microCommand/RespondToHandshake";
import {WebsocketDescriptor} from "../data/SocketDescriptor";
import {ClientConnectionPool} from "../../clientConnectionPool";

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
                request: {socket},
                requestInfo, configurationContext, extensions, socketDescriptor
            },
            logger: {debug},
            clientConnectionPool
        } = this;

        if (this.executionIsHalted) {
            debug(`ValidateNewWebsocket halted with err`, requestInfo);
            return;
        }

        const connection = new WebsocketClientConnection(
            socket,
            socketDescriptor as WebsocketDescriptor,
            configurationContext,
            extensions
        );

        clientConnectionPool.registerConnection(connection);
    }

    protected async executeSubCommand(command: SubCommand<T>): Promise<T> {
        const result = super.executeSubCommand(command);

        const value = isPromise(result) ? await result : result;
        console.log('>> done -> executeSubCommand', {command: referenceToString(command.type), value});

        if (value === false) {
            console.log('Halt ValidateNewWebsocket at', referenceToString(command.type));
            this.haltExecution();
        }
        return result;
    }

}



