import {AsyncValidationEvent} from "qft";
import {ConfigurationContext} from "../../configurationContext";
import {SocketDescriptor} from "../data/SocketDescriptor";

/**
 * Event notification dispatched as new socket connection is encountered and before it is ready to be added to
 * connection pool it must be validated.
 * This event is dispatched in order to let third parties prevent this connection being established.
 */
export class ValidateSocketConnectionEvent extends AsyncValidationEvent<ValidationError> {
    static readonly TYPE = Symbol('validate-socket-connection-event');

    constructor(readonly descriptor: Readonly<SocketDescriptor>, readonly context: ConfigurationContext) {
        super(ValidateSocketConnectionEvent.TYPE);
    }
}

export type ValidationError = { error: string, message?: string };


