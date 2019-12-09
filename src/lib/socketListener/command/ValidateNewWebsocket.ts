import {EventDispatcher, Inject, MacroCommand, referenceToString, SubCommand} from "qft";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../logger";
import {AuthorizeConnectionContext} from "./websocketValidators/AuthorizeConnectionContext";
import {ValidateConnectionHeaders} from "./websocketValidators/ValidateConnectionHeaders";
import {NewSocketConnectionEvent} from "../event/NewSocketConnectionEvent";
import {WebsocketClientConnection} from "../model/WebsocketClientConnection";
import {PrepareWebsocketExtensions} from "./websocketValidators/PrepareWebsocketExtensions";
import {isPromise} from "../../utils/is-promise";
import {RespondToHandshake} from "./websocketValidators/RespondToHandshake";
import {WebsocketDescriptor} from "../data/SocketDescriptor";

export class ValidateNewWebsocket<T = boolean> extends MacroCommand<T> {

    @Inject()
    private readonly event: WebsocketConnectionValidationRequest;
    @Inject()
    private readonly logger: Logger;
    @Inject()
    private readonly eventDispatcher: EventDispatcher;

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
            eventDispatcher
        } = this;

        if (this.executionIsHalted) {
            debug(`ValidateNewWebsocket halted with err`, requestInfo);
            return;
        }

        const connection = new WebsocketClientConnection(
            socketDescriptor as WebsocketDescriptor,
            configurationContext,
            socket,
            extensions
        );

        // TODO: Remove this at some point
        connection.addEventListener("message", ({message}) => connection.send(message));
        connection.addEventListener("data", ({data}) => connection.send(data));

        eventDispatcher.dispatchEvent(new NewSocketConnectionEvent(connection));
    }

    protected async executeSubCommand(command: SubCommand<T>): Promise<T> {
        const result = super.executeSubCommand(command);

        const value = isPromise(result) ? await result : result;
        console.log('>> done -> executeSubCommand', {command: referenceToString(command.type), value});

        if (value as any === false) { // TODO "as any" should not be needed in here
            console.log('Halt ValidateNewWebsocket at', referenceToString(command.type));
            this.haltExecution();
        }
        return result;
    }

}



