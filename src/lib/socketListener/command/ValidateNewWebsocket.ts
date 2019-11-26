import {EventDispatcher, Inject, MacroCommand, SubCommand} from "qft";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../logger";
import {AuthorizeConnectionContext} from "./websocketValidators/AuthorizeConnectionContext";
import {ValidateConnectionHeaders} from "./websocketValidators/ValidateConnectionHeaders";
import {NewSocketConnectionEvent} from "../event/NewSocketConnectionEvent";
import {WebsocketClientConnection} from "../model/WebsocketClientConnection";
import {PrepareWebsocketExtensions} from "./websocketValidators/PrepareWebsocketExtensions";
import {isPromise} from "../util/is-promise";
import {RespondToHandshake} from "./websocketValidators/RespondToHandshake";

export class ValidateNewWebsocket<T = false | never> extends MacroCommand<T> {

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
                requestInfo, configurationContext, extensions
            },
            logger: {debug},
            eventDispatcher
        } = this;

        if (this.executionIsHalted) {
            debug(`ValidateNewWebsocket halted with err`, requestInfo);
            return;
        }

        const connection = new WebsocketClientConnection(socket, configurationContext, extensions);
        eventDispatcher.dispatchEvent(new NewSocketConnectionEvent(connection));
    }

    protected async executeSubCommand(command: SubCommand<T>): Promise<T> {
        const result = super.executeSubCommand(command);

        const value = isPromise(result) ? await result : result;
        console.log('>> executeSubCommand result', value);

        if (value as any === false) { // TODO "as any" should not be needed in here
            console.log('Halt ValidateNewWebsocket at', command);
            this.haltExecution();
        }
        return result;
    }

}



