import { Event } from "quiver-framework";

/**
 * Event subclass that incorporate event response data.
 */
// TODO: Move this to QFT as it looks handy in general?
export class ResponsiveEvent<R, T = any> extends Event<T> {

    readonly response: Promise<R>;
    private responseCallback: (value: R) => void;
    private _responseIsSet = false;

    constructor(type: string | Symbol, data?: T) {
        super(type, data);
        this.response = new Promise<R>(resolve => this.responseCallback = resolve);
    }

    /**
     * Set response to event notification
     * @param value
     */
    readonly setResponse = (value: R) => {
        if (this._responseIsSet) {
            throw new Error(`Response can be set only once!`);
        }
        this._responseIsSet = true;
        this.responseCallback(value);
    };

    get responseIsSet(): boolean {
        return this._responseIsSet;
    }
}
