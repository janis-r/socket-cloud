import {AsyncValidationEvent} from "quiver-framework";
import {ConfigurationContext} from "../../configurationContext/data/ConfigurationContext";
import {SocketDescriptor} from "../data/SocketDescriptor";
import {OperatorHandshakeResponse} from "../data/OperatorHandshakeResponse";

/**
 * Event notification dispatched as new socket connection is encountered and before it is ready to be added to
 * connection pool it must be validated.
 * This event is dispatched in order to let third parties prevent this connection being established.
 */
export class ValidateSocketConnectionEvent extends AsyncValidationEvent<ValidationError> {

    static readonly TYPE = Symbol('validate-socket-connection-event');

    private _operatorData: OperatorHandshakeResponse;

    constructor(readonly descriptor: Readonly<SocketDescriptor>, readonly context: ConfigurationContext) {
        super(ValidateSocketConnectionEvent.TYPE);
    }

    get operatorData(): OperatorHandshakeResponse {
        return this._operatorData;
    }

    set operatorData(value: OperatorHandshakeResponse) {
        if (this._operatorData) {
            throw new Error(`operatorData is one time set only property`);
        }
        this._operatorData = value;
    }
}

export type ValidationError = { error: string, message?: string };

