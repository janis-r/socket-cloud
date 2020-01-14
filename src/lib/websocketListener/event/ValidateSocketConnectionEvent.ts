import {AsyncValidationEvent} from "qft";
import {ConfigurationContext} from "../../configurationContext";
import {SocketDescriptor} from "../data/SocketDescriptor";
import {OperatorData} from "../data/OperatorData";

/**
 * Event notification dispatched as new socket connection is encountered and before it is ready to be added to
 * connection pool it must be validated.
 * This event is dispatched in order to let third parties prevent this connection being established.
 */
export class ValidateSocketConnectionEvent extends AsyncValidationEvent<ValidationError> {

    static readonly TYPE = Symbol('validate-socket-connection-event');

    private _operatorData: OperatorData;

    constructor(readonly descriptor: Readonly<SocketDescriptor>, readonly context: ConfigurationContext) {
        super(ValidateSocketConnectionEvent.TYPE);
    }

    get operatorData(): OperatorData {
        return this._operatorData;
    }

    set operatorData(value: OperatorData) {
        if (this._operatorData) {
            throw new Error(`operatorData is one time set only property`);
        }
        this._operatorData = value;
    }
}

export type ValidationError = { error: string, message?: string };

