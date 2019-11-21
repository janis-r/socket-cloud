import {Event} from "qft";
import {Socket} from "net";
import {WebsocketUpgradeRequest} from "../data/WebsocketUpgradeRequest";
import {SocketDescriptor} from "../data/SocketDescriptor";
import {ConfigurationContext} from "../../configurationContext";

/**
 * Event notification dispatched as new websocket connection is encountered and needs to be validated before it
 * can be put in use.
 * (This is only initial validation there will be more once this event is done)
 */
export class WebsocketConnectionValidationRequest extends Event {
    static readonly TYPE = Symbol('validate-websocket-connection-event');

    private _socketDescriptor: SocketDescriptor;
    private _configurationContext: ConfigurationContext;

    constructor(readonly request: WebsocketUpgradeRequest, readonly socket: Socket, readonly requestInfo: string) {
        super(WebsocketConnectionValidationRequest.TYPE);
    }


    get socketDescriptor(): SocketDescriptor {
        return this._socketDescriptor;
    }

    set socketDescriptor(value: SocketDescriptor) {
        if (this._socketDescriptor) {
            throw new Error('socketDescriptor cannot be overwritten');
        }
        this._socketDescriptor = value;
    }


    get configurationContext(): ConfigurationContext {
        return this._configurationContext;
    }

    set configurationContext(value: ConfigurationContext) {
        if (this._configurationContext) {
            throw new Error('configurationContext cannot be overwritten');
        }
        this._configurationContext = value;
    }
}
